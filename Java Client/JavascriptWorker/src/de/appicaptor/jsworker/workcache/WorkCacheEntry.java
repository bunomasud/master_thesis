package de.appicaptor.jsworker.workcache;

import java.nio.file.Path;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import de.appicaptor.common.documents.IosDevice;
import de.appicaptor.common.worker.ClientSession;
import de.appicaptor.common.worker.interfaces.ios.IOSWorkerInterface;
import de.appicaptor.jsworker.tools.getappinfo.AppInfo;

/**
 * <p>
 * A {@link WorkCacheEntry} is an opaque object that contains internal state for {@link WorkCacheManager} and that is
 * designed to be stored in the worker's {@link ClientSession}.
 * This cache is different from the IDA App cache in that it contains both an extracted as well as an compressed version
 * of the App's IPA and only
 * exists between calls to
 * {@link IOSWorkerInterface#startAppSession(de.appicaptor.common.documents.IosApp, de.appicaptor.common.documents.IosDevice)}
 * and
 * {@link IOSWorkerInterface#endAppSession(de.appicaptor.common.documents.IosApp, de.appicaptor.common.documents.IosDevice)}
 * </p>
 * <p>
 * Instances of this class are intended to be used by {@link WorkCacheManager} only. No external access should be
 * permitted.
 * External classes should view instances of this class as opaque tokens that are part of the worker's session
 * abstraction.
 * </p>
 * 
 * @author rueckrie
 *
 */
/*
 * On-disk structure of the cache: 
 * <tempdir>/ipa.ipa // App ipa
 * 
 * <tempdir>/app/ // Extracted IPA
 * <tempdir>/decryptedBinary // Decrypted binary
 * <tempdir>/ddectool/ // example for a subroutine tmp folder
 */
public class WorkCacheEntry {

	/**
	 * Stores the md5 hash of the app
	 */
	protected String md5ofBinary;
	
	/**
	 * Stores basic information about the on-device App.
	 * Null iff the App is not installed
	 */
	protected AppInfo deviceAppInfo;

	/**
	 * Storage path to the decrypted App binary on-worker.
	 * Null if the App is not decrypted
	 */
	protected Path workerDecryptedBinary;

	/**
	 * 
	 */
	protected Path workerBinaryDir;
	
	/**
	 * Path to the local cache directory
	 */
	protected Path workerBaseDir;

	/**
	 * Device upon which the App is installed
	 */
	protected IosDevice device;

	/**
	 * Bundle Id of the App
	 * If this is null the cache entry must be considered invalid and must not be used
	 */
	protected String bundleId;

	/**
	 * Path to the binary itself (non-decrypted)
	 * Null if the App has not yet been unzipped from ipa/installed
	 */
	protected Path workerBinary;
	
	/**
	 * Path to extracted on-worker bundle directory
	 * Null if the App has not yet been installed on the device
	 */
	protected Path workerExtractedBundle;

	/**
	 * Path to the App's IPA
	 * Null if the App has not yet been installed on the device
	 */
	protected Path workerIpa;
	
	/**
	 * Array of paths to work directories of subroutines using the workcachemanager
	 * (i.e. <tempdir>/ddectool/)
	 */
	protected Map<String, Path> subdirectories = Collections.synchronizedMap(new HashMap<String, Path>());
	
	protected String sessionID;
}
