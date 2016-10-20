package de.appicaptor.jsworker.workcache;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.FileVisitResult;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.SimpleFileVisitor;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Supplier;

import org.apache.commons.io.IOUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.databind.JsonNode;

import de.appicaptor.common.documents.IosApp;
import de.appicaptor.common.documents.IosDevice;
import de.appicaptor.common.exceptions.FatalAppCheckException;
import de.appicaptor.common.utils.IosUtils;
import de.appicaptor.common.utils.PlistInfo;
import de.appicaptor.jsworker.tools.getappinfo.AppInfo;

/**
 * Manages {@link WorkCacheEntry} instances.
 * {@link WorkerNT} calls methods of this class at the appropriate points of its workflow.
 * <br>
 * Due to its nature this class will exclusively throw subclasses of {@link FatalAppCheckException}
 * 
 * @author rueckrie
 *
 */
public class WorkCacheManager {

	private final Logger log = LoggerFactory.getLogger(WorkCacheManager.class);

	/**
	 * This is kludge to make the shutdown hook work.
	 * It is a map containing all active working directories so that they may be deleted upon exit
	 */
	protected Map<String, Path> activeWorkingDirectories;

	private Map<String, WorkCacheEntry> lookupTable = Collections
			.synchronizedMap(new HashMap<String, WorkCacheEntry>());

	/**
	 * Function used to return the sessionID
	 */
	protected Supplier<String> sessionIdSupplier;

	public WorkCacheManager(Supplier<String> sessionId) {
		activeWorkingDirectories = new HashMap<>();
		sessionIdSupplier = sessionId;
		// Shutdown hook, cleans caches upon exit 
		Runtime.getRuntime().addShutdownHook(new Thread() {
			@Override
			public void run() {
				for (Path p : activeWorkingDirectories.values()) {
					try {
						deleteDirectoryRecursive(p);
					} catch (Exception e) {
						// we are at shutdown therefore ignore 
						log.warn("Shutdown hook: Unable to delete directory: {}", p);
					}
				}
			}
		});
	}

	/**
	 * Initializes the basic cache structures, preparing the cache for the given App/device combination
	 * 
	 * @param app
	 *            The App to be analyzed
	 * @param device
	 *            Device upon which the App is to be installed
	 * @return SessionID identifying the cache entry for this session
	 */
	// TODO: Test me 
	public String initializeCache(IosApp app,String sessionID) {
		log.debug("Initializing WorkCacheEntry: " + sessionID);
		WorkCacheEntry entry = new WorkCacheEntry();

		
		try {
			
			String property = "java.io.tmpdir";

			String tempDir = System.getProperty(property);
			
			Path workerNTroot = Paths.get(tempDir);
			if(!Files.exists(workerNTroot)){
				Files.createDirectories(workerNTroot);
			}
		} catch (IOException e1) {
			e1.printStackTrace();
		}
		
		// Obtain temporary cache directory
		Path workdir = createCacheDirectory(sessionID);
		
		// Initialize entry
		entry.sessionID = sessionID;
		//HOTFIX
		entry.device = null;
		if (app != null){
			entry.bundleId = app.getBundleId();
		} else {
			entry.bundleId = null;
		}
		entry.workerBaseDir = workdir;
		entry.workerBinaryDir = null;
		entry.md5ofBinary = null;
		entry.deviceAppInfo = null;
		entry.workerDecryptedBinary = null;
		entry.workerBinary = null;
		entry.workerExtractedBundle = null;
		entry.workerIpa = null;
		
		// Write IPA to WCM (entry)
		try {
			if (entry.bundleId != null){
				entry.workerIpa = Files.createFile(Paths.get(entry.workerBaseDir.toString() + File.separator + entry.bundleId + ".ipa"));
			} else {
				entry.workerIpa = Files.createFile(Paths.get(entry.workerBaseDir.toString() + "/" + "NoBundleID.ipa"));
			}
			FileOutputStream fos = new FileOutputStream(entry.workerIpa.toString());
			try{
				if (app != null){
					fos.write(app.getIpa());
				} else {
					log.error("App-object is null! No IPA found, WCM entry.workerIpa will be empty");
				}
			}catch(NullPointerException e){
				log.error("App-object is null! No IPA found, WCM entry.workerIpa will be empty");
			}
			
			fos.close();
		} catch (IOException e) {
			e.printStackTrace();
			log.error("Error writing IPA to WCM");
		}
		log.debug("IPA written to WCM");

		lookupTable.put(sessionID, entry);
		return sessionID;
	}

	/**
	 * Deinitializes the given cache entry, cleaning up resources.
	 * The entry is thereafter considered to be invalid and must not be reused
	 * 
	 * @param entry
	 */
	// TODO: Test me 
	public void deinitializeCache() {
		log.debug("Starting: deinitializeCache");
		// First invalidate entry then delete.
		// Reason: If deleting fails the entry is already invalidated and thus no longer usable avoiding accidential access to partially-deleted directories

		// Backup information required for delete
		if(null!=getWorkCacheEntry()){
			String sessionID = getWorkCacheEntry().sessionID;
			Path workdir = getWorkCacheEntry().workerBaseDir;

			// Invalidate
			getWorkCacheEntry().sessionID = null;
			getWorkCacheEntry().bundleId = null;
			getWorkCacheEntry().device = null;
			getWorkCacheEntry().deviceAppInfo = null;
			getWorkCacheEntry().workerBaseDir = null;
			getWorkCacheEntry().workerDecryptedBinary = null;
			getWorkCacheEntry().workerIpa = null;
			getWorkCacheEntry().workerBinaryDir = null;
			getWorkCacheEntry().md5ofBinary = null;
			getWorkCacheEntry().workerBinary = null;
			getWorkCacheEntry().workerExtractedBundle = null;
			getWorkCacheEntry().subdirectories = null;

			// Delete 
			// Security check 
			if (!activeWorkingDirectories.containsKey(sessionID) || workdir == null) {
				String msg = String.format("Unknown bundle id '%s' or workdir not set", sessionID);
				log.error(msg);
				throw new FatalAppCheckException(msg);
			}

			deleteDirectoryRecursive(workdir);
			lookupTable.remove(sessionID);
			activeWorkingDirectories.remove(sessionID);// Last step, if delete fails this class will retry upon VM termination
			
		}

	}

	/**
	 * Internal helper, handles the lookup of the WorkCacheEntry by a given sessionID
	 * 
	 * @param sessionID
	 * @return
	 */
	// TODO: Test me
	private WorkCacheEntry getWorkCacheEntry() {
		if (sessionIdSupplier.get() != null) {
			return lookupTable.get(sessionIdSupplier.get());
		} else {
			return null;
		}
	}

	/**
	 * Internal helper, creates a temporary directory for the cache
	 * 
	 * @return Path to directory
	 */
	protected Path createCacheDirectory(String sessionID) {
		try {
			
			String property = "java.io.tmpdir";

			String tempDir = System.getProperty(property);
			Path result = Files.createTempDirectory(Paths.get(tempDir), "WorkCacheManager");
			activeWorkingDirectories.put(sessionID, result);

			log.trace("Added new cache directory: {}", result.toString());
			return result;

		} catch (IOException e) {
			String msg = "Unable to create workdir";
			log.error(msg, e);
			throw new FatalAppCheckException(msg, e);
		}
	}

	/**
	 * External function to check existing sessionIDs
	 * 
	 * @param sessionID
	 * @return
	 */
	public boolean checkSessionId(String sessionID){
		return activeWorkingDirectories.containsKey(sessionID);
	}
	
	/**
	 * External function to create subdirectories for a given WorkCacheEntry
	 * 
	 * @param name
	 *            name of the subdirectory
	 * @return
	 */
	public Path getSubCacheDirectory(String name) {
		if (getWorkCacheEntry().subdirectories.containsKey(name)) {
			return getWorkCacheEntry().subdirectories.get(name);
		} else {
			try {
				Path result = Files.createDirectory(Paths.get(getWorkerBaseDir().toString(), name));
				getWorkCacheEntry().subdirectories.put(name, result);
				log.trace("Added new cache subdirectory: {}", result.toString());
				return result;

			} catch (IOException e) {
				String msg = "Unable to create sub-workdir";
				log.error(msg, e);
				throw new FatalAppCheckException(msg, e);
			}
		}
	}

	/**
	 * Internal helper, recursively removes a directory hierarchy.
	 * Use with caution
	 */
	protected void deleteDirectoryRecursive(Path dir) {
		log.debug("Starting recursive delete of '{}'", dir);
		try {
			// Taken from javadocs: https://docs.oracle.com/javase/8/docs/api/java/nio/file/FileVisitor.html
			Files.walkFileTree(dir, new SimpleFileVisitor<Path>() {
				@Override
				public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) throws IOException {
					Files.delete(file);
					return FileVisitResult.CONTINUE;
				}

				@Override
				public FileVisitResult postVisitDirectory(Path dir, IOException e) throws IOException {
					if (e == null) {
						Files.delete(dir);
						return FileVisitResult.CONTINUE;
					} else {
						throw e;
					}
				}
			});
		} catch (Exception e) {
			String msg = String.format("Failed to delete directory: %s", dir);
			log.trace(msg, e);// Only trace as it creates spurious error log entries that are not a real problem as a new exception is thrown (somebody else has to handle this;) )
			throw new FatalAppCheckException(msg, e);
		}
	}

	/**
	 * Getter for all workCacheEntry-Variables in the log output
	 * (for debug purpose!)
	 */
	public void logWorkCacheState() {
		WorkCacheEntry wce = getWorkCacheEntry();
		if (wce != null) {
			
			if (wce.bundleId != null) {
				log.debug("WCM-Entry bundleId: " + wce.bundleId);
			} else {
				log.debug("WCM-Entry bundleId: NOT FOUND");
			}

		/*	if (wce.device.getName() != null) {
				log.debug("WCM-Entry deviceName: " + wce.device.getName());
			} else {
				log.debug("WCM-Entry deviceName: NOT FOUND");
			}*/

			if (wce.deviceAppInfo != null) {
				log.debug("WCM-Entry deviceAppInfo-BundleIdentifier: " + wce.deviceAppInfo.getBundleIdentifier());

			} else {
				log.debug("WCM-Entry deviceAppInfo-BundleIdentifier: NOT FOUND");
			}

			if (wce.workerBaseDir != null) {
				log.debug("WCM-Entry workerBaseDir: " + wce.workerBaseDir.toString());
			} else {
				log.debug("WCM-Entry workerBaseDir: NOT FOUND");
			}
			
			if (wce.workerBinaryDir != null) {
				log.debug("WCM-Entry workerBinaryDir: " + wce.workerBinaryDir.toString());
			} else {
				log.debug("WCM-Entry workerBinaryDir: NOT FOUND");
			}
			
			if (wce.workerBinary != null) {
				log.debug("WCM-Entry workerBinary: " + wce.workerBinary.toString());
			} else {
				log.debug("WCM-Entry workerBinary: NOT FOUND");
			}

			if (wce.workerExtractedBundle != null) {
				log.debug("WCM-Entry workerExtractedBundle: " + wce.workerExtractedBundle.toString());
			} else {
				log.debug("WCM-Entry workerExtractedBundle: NOT FOUND");
			}

			if (wce.workerIpa != null) {
				log.debug("WCM-Entry workerIpa: " + wce.workerIpa.toString());
			} else {
				log.debug("WCM-Entry workerIpa: NOT FOUND");
			}

			if (wce.subdirectories != null) {
				log.debug("WCM-Entry #subdirectories: " + wce.subdirectories.size());
			} else {
				log.debug("WCM-Entry subdirectories: NOT FOUND");
			}

			if (wce.workerDecryptedBinary != null) {
				log.debug("WCM-Entry decryptedBinary: " + wce.workerDecryptedBinary.toString());
			} else {
				log.debug("WCM-Entry decryptedBinary: NOT FOUND");
			}
			
			if (wce.sessionID != null) {
				log.debug("WCM-Entry sessionID: " + wce.sessionID);
			} else {
				log.debug("WCM-Entry sessionID: NOT FOUND");
			}
			
			if (wce.workerBinaryDir != null) {
				log.debug("WCM-Entry workerBinaryDir: " + wce.workerBinaryDir.toString());
			} else {
				log.debug("WCM-Entry workerBinaryDir: NOT FOUND");
			}
			
			if (wce.md5ofBinary != null) {
				log.debug("WCM-Entry md5ofBinary: " + wce.md5ofBinary);
			} else {
				log.debug("WCM-Entry md5ofBinary: NOT FOUND");
			}
			
		} else {
			log.debug("WCM-Entry NOT FOUND");
		}
	}

	/**
	 * Getter for ipa-path
	 * 
	 * @return
	 */
	public Path getIpaPath() {
		if (getWorkCacheEntry() != null) {
			return getWorkCacheEntry().workerIpa;
		} else {
			return null;
		}
	}

	/**
	 * Getter for bundle-path
	 * 
	 * @return
	 */
	public Path getExtractedBundlePath() {
		if (getWorkCacheEntry() != null) {
			return getWorkCacheEntry().workerExtractedBundle;
		} else {
			return null;
		}
	}

	/**
	 * Setter for bundle-path
	 * 
	 */
	public void setExtractedBundlePath(Path bundlePath) {
		if (getWorkCacheEntry() != null) {
			getWorkCacheEntry().workerExtractedBundle = bundlePath;
		}
	}

	/**
	 * Getter for binary-path
	 * 
	 * @return
	 */
	public Path getBinaryPath() {
		if (getWorkCacheEntry() != null) {
			return getWorkCacheEntry().workerBinary;
		} else {
			return null;
		}
	}

	/**
	 * Setter for binary-path
	 */
	public void setBinaryPath(Path binaryPath) {
		if (getWorkCacheEntry() != null) {
			getWorkCacheEntry().workerBinary = binaryPath;
		}
	}

	/**
	 * Getter for decrypted binary
	 * 
	 * @return
	 */
	public Path getDecryptedBinary() {
		if (getWorkCacheEntry() != null) {
			return getWorkCacheEntry().workerDecryptedBinary;
		} else {
			return null;
		}
	}
	
	public void setWorkerDecryptedBinary(Path decryptedBinaryPath){
		if (getWorkCacheEntry() != null) {
			getWorkCacheEntry().workerDecryptedBinary = decryptedBinaryPath;
		}
	}

	/**
	 * Getter for device
	 * 
	 * @return
	 */
	public IosDevice getDevice() {
		if (getWorkCacheEntry() != null) {
			return getWorkCacheEntry().device;
		} else {
			return null;
		}
	}

	/**
	 * Getter for temporary base dir
	 * 
	 * @return
	 */
	public Path getWorkerBaseDir() {
		if (getWorkCacheEntry() != null) {
			return getWorkCacheEntry().workerBaseDir;
		} else {
			return null;
		}
	}

	/**
	 * external function to remove the BundlePath/BinaryPath
	 */
	public void uninstallApp() {
		if (getWorkCacheEntry() != null) {
			deleteDirectoryRecursive(getWorkCacheEntry().workerExtractedBundle);
			getWorkCacheEntry().workerBinary = null;
			getWorkCacheEntry().workerExtractedBundle = null;
			getWorkCacheEntry().deviceAppInfo = null;
		}
	}

	public void setWorkerBinaryDir(Path workerBinaryDir){
		getWorkCacheEntry().workerBinaryDir = workerBinaryDir;
	}
	
	public Path getWorkerBinaryDir(){
		return getWorkCacheEntry().workerBinaryDir;
	}
	
	/**
	 * Getter for bundleid
	 * 
	 * @return
	 */
	public String getBundleId() {
		if (getWorkCacheEntry() != null) {
			return getWorkCacheEntry().bundleId;
		} else {
			return null;
		}
	}
	
	public AppInfo getAppInfo() {
		if (getWorkCacheEntry() != null) {
			if (getWorkCacheEntry().deviceAppInfo == null){
				getWorkCacheEntry().deviceAppInfo = parseAppInfo();
			}
			return getWorkCacheEntry().deviceAppInfo;
		} else {
			return null;
		}
	}
	
	public String getMd5OfBinary(){
		if (getWorkCacheEntry() != null){
			return getWorkCacheEntry().md5ofBinary;
		} else {
			return null;
		}
	}
	
	public void setMd5OfBinary(String hash){
		getWorkCacheEntry().md5ofBinary = hash;
	}
	
	public AppInfo parseAppInfo() {
		log.debug("Starting: parseAppInfo");
		AppInfo appinfo = null;
		try {
			PlistInfo pInfo = IosUtils.extractInfoPlistFromIPA(getIpaPath().toFile());

			File plistFilename = new File(pInfo.getFilename());

			InputStream fis = new FileInputStream(
					new File(getExtractedBundlePath().toFile(), plistFilename.toString()));
			byte[] infoPlist = IOUtils.toByteArray(fis);
			// Get AppName
			JsonNode plist = IosUtils.getJsonNodeFromInfoPlist(infoPlist);
			Map<String, Object> placeHolderHashMap = new HashMap<String, Object>();
			Map<String, String> placeHolderGroupContainerPaths = new HashMap<String, String>();
			List<Integer> placeHolderDeviceFamily = new ArrayList<Integer>();
			
			appinfo = new AppInfo(
					IosUtils.getStringValueFromInfoPlist(plist, "MinimumOSVersion"),
					"applicationDsid",
					"applicationType",
					"dataContainerPath",
					IosUtils.getStringValueFromInfoPlist(plist, "CFBundleShortVersionString"),
					getExtractedBundlePath().toString(),
					"vendorName",
					"bundleContainerPath",
					IosUtils.getStringValueFromInfoPlist(plist, "DTSDKBuild"),
					placeHolderDeviceFamily, //IosUtils.getStringValueFromInfoPlist(plist, "UIDeviceFamily"),
					IosUtils.getStringValueFromInfoPlist(plist, "CFBundleIdentifier"),
					"sourceAppIdentifier",
					IosUtils.getStringValueFromInfoPlist(plist, "CFBundleExecutable"),
					"containerPath",
					placeHolderGroupContainerPaths,
					"localizedName",
					placeHolderHashMap,	//getEntitlementsOfApp("", workCacheManager.getDevice()),
					IosUtils.getStringValueFromInfoPlist(plist, "CFBundleVersion"));
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		return appinfo;
	}

	public void setIpaPath(Path newIpaPath) {
		getWorkCacheEntry().workerIpa = newIpaPath;
	}
}
