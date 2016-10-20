/**
 * 
 */
package de.appicaptor.jsworker.javascriptworker;

import java.awt.List;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.FileWriter;
import java.io.FilenameFilter;
import java.io.IOException;
import java.io.InputStream;
import java.io.ObjectOutput;
import java.io.ObjectOutputStream;
import java.io.StringWriter;
import java.math.BigInteger;
import java.net.URI;
import java.nio.file.FileSystems;
import java.nio.file.FileVisitResult;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.SimpleFileVisitor;
import java.nio.file.attribute.BasicFileAttributes;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.Iterator;
import java.util.Random;
import java.util.Set;
import java.util.concurrent.Callable;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;
import java.util.zip.GZIPInputStream;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

import javax.xml.ws.spi.http.HttpContext;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import de.appicaptor.common.documents.IndicatorJSON;
import de.appicaptor.common.documents.IosApp;
import de.appicaptor.common.documents.IosDevice;
import de.appicaptor.common.exceptions.FatalAppCheckException;
import de.appicaptor.common.logging.LogUtils;
import de.appicaptor.common.worker.ClientSession;
import de.appicaptor.common.worker.WorkerHttpServer;
import de.appicaptor.common.worker.interfaces.ios.ITunesSearcherEnums.Country;
import de.appicaptor.jsworker.workcache.WorkCacheManager;
import de.appicaptor.common.worker.interfaces.ios.JavaScriptWorkerInterface;

import org.apache.commons.io.IOUtils;
import org.apache.commons.logging.Log;
import org.apache.http.HttpEntity;
import org.apache.http.client.HttpRequestRetryHandler;
import org.apache.http.client.config.RequestConfig;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.ContentType;
import org.apache.http.entity.mime.MultipartEntityBuilder;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.DefaultHttpClient;
import org.apache.http.impl.client.HttpClientBuilder;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.params.BasicHttpParams;
import org.apache.http.params.HttpConnectionParams;
import org.apache.http.params.HttpParams;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * @author rahman
 *
 */
public class JavaScriptWorker implements JavaScriptWorkerInterface {

	/**
	 * @param args
	 */

	static {
		LogUtils.configureLog();
	}

	private final static Logger log = LoggerFactory.getLogger(JavaScriptWorker.class);

	private static final String USER_AGENT = "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:22.0) Gecko/20100101 Firefox/22.0";
	private static WorkerHttpServer workerHttpServer;
	private static ScheduledExecutorService collector;
	private static ConcurrentLinkedQueue<Future<JSONObject>> unfinishedStuff;
	// private int numberOfReqs=0;
	private int start = 0;
	/**
	 * WorkCacheManager
	 */
	protected WorkCacheManager workCacheManager;
	public static final int workerPort = 7575;

	// Runnable () -> {
	// for(Future c : unfinishedStuff.)
	// };

	public static void main(String[] args) {

		JavaScriptWorker JW = new JavaScriptWorker();
		WorkCacheManager workCacheManager = new WorkCacheManager(
				() -> (String) ClientSession.getClientSession().getData());
		JW.workCacheManager = workCacheManager;
		workerHttpServer = WorkerHttpServer.createInstance(workerPort, true);
		workerHttpServer.addWorker(JW);
		workerHttpServer.start();

	}

	private String getLibraryNames(String extractedPath) throws Exception {
		// TODO Auto-generated method stub
		CopyOnWriteArrayList<JSONObject> resultList = new CopyOnWriteArrayList<JSONObject>();

		collector = Executors.newScheduledThreadPool(1);
		unfinishedStuff = new ConcurrentLinkedQueue<>();
		File fileToWrite = new File(workCacheManager.getWorkerBaseDir() + File.separator + "result.txt");
		fileToWrite.getParentFile().mkdirs();
		FileWriter result = new FileWriter(fileToWrite.getAbsolutePath());
		int cores = Runtime.getRuntime().availableProcessors();
		ExecutorService executor = new ThreadPoolExecutor(cores, cores, 10, TimeUnit.MINUTES,
				new LinkedBlockingQueue<Runnable>());

		File file = new File(extractedPath);
		String[] directories = file.list(new FilenameFilter() {

			@Override
			public boolean accept(File current, String name) {
				return new File(current, name).isDirectory();
			}
		});

		collector.scheduleAtFixedRate(new Runnable() {

			@Override
			public void run() {
				if (start == 1 && unfinishedStuff.size() == 0) {
					try {

						ArrayList<JsonObject> list = new ArrayList<JsonObject>();
						Gson gson = new Gson();
						for (JSONObject enrty : resultList) {
							JsonParser jsonParser = new JsonParser();
							JsonObject gsonObject = (JsonObject) jsonParser.parse(enrty.toString());
							list.add(gsonObject);
						}
						gson.toJson(list, result);

					} catch (Exception e) {
						e.printStackTrace();
					} finally {
						try {
							result.flush();
							result.close();
						} catch (IOException e) {
							e.printStackTrace();
						}

					}
					collector.shutdown();
				}
				for (Future<JSONObject> c : unfinishedStuff) {
					if (c.isDone()) {
						try {

							if (null != c.get()) {
								resultList.add(c.get());
							}
							unfinishedStuff.remove(c);

						} catch (InterruptedException e) {

							e.printStackTrace();
						} catch (ExecutionException e) {

							e.printStackTrace();
						}

					}

				}
			}
		}, 300, 10, TimeUnit.MILLISECONDS);

		for (String dir : directories) {

			Path start = FileSystems.getDefault().getPath(extractedPath + System.getProperty("file.separator") + dir);
			Files.walkFileTree(start, new SimpleFileVisitor<Path>() {

				@Override
				public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) throws IOException {

					if (file.toString().endsWith(".js")) {

						CallToNodeAPI callApi = new CallToNodeAPI(file);
						Future<JSONObject> f1 = executor.submit(callApi);
						unfinishedStuff.add(f1);
					}
					return FileVisitResult.CONTINUE;
				}
			});

		}
		start = 1;

		while (!collector.isTerminated()) {
			/// System.out.println("Waiting.."+collector.isTerminated());
		}
		if (collector.isShutdown()) {
			executor.shutdown();
		}
		return fileToWrite.toString();
	}

	private static final class CallToNodeAPI implements Callable<JSONObject> {
		private Path fileToProcess;

		CallToNodeAPI(Path file) {
			fileToProcess = file;

		}

		@SuppressWarnings("deprecation")
		public JSONObject call() throws Exception {
			DefaultHttpClient client = new DefaultHttpClient();
			client.setHttpRequestRetryHandler(new HttpRequestRetryHandler() {
				@Override
				public boolean retryRequest(IOException exception, int executionCount,
						org.apache.http.protocol.HttpContext context) {
					// TODO Auto-generated method stub
					if (executionCount > 5) {
						log.error("Maximum tries reached for client http pool ");
						return false;
					}
					if (exception instanceof org.apache.http.NoHttpResponseException) {
						log.error("No response from server on " + executionCount + " call");
						return true;
					}
					return false;
				}
			});
			HttpPost httpPost = new HttpPost("http://127.0.0.1:3000/upload/file");
			httpPost.addHeader("accept", "application/json");

			MultipartEntityBuilder builder = MultipartEntityBuilder.create();
			builder.addTextBody("filePath", fileToProcess.toString());

			HttpEntity multipart = builder.build();
			httpPost.setEntity(multipart);
			CloseableHttpResponse response = client.execute(httpPost);
			HttpEntity en = response.getEntity();
			// assertThat(response.getStatusLine().getStatusCode().equal(200));
			if (response.getStatusLine().getStatusCode() == 200) {
				JSONObject res = new JSONObject();
				// System.out.println(response);
				@SuppressWarnings("deprecation")
				String json = IOUtils.toString(response.getEntity().getContent());
				if (!json.isEmpty()) {
					JSONArray jObjectArray = new JSONArray(json);
					// Result resBetter = new Result(1, "jquery");
					float minJDFx = 1;
					float minJDDec = 1;
					float minJDCallExp = 1;
					// Result res = new Result(1, dir);

					// res.setFilePath(file.toString());
					 res.put("File Path", fileToProcess);
					 res.put("Result", "Lets see!");
					// Set<String> libsetJDZero = new HashSet<String>();
					// Set<String> libsetJDNonZero = new HashSet<String>();
					if (null != jObjectArray && jObjectArray.length() > 0) {
						for (int i = 0; i < jObjectArray.length(); i++) {

							// String IntersectionLengthFuncDec =
							// jObjectArray.getJSONObject(i)
							// .get("IntersectionLengthFuncDec").toString();
							String IntersectionLengthFuncEx = jObjectArray.getJSONObject(i)
									.get("IntersectionLengthFuncEx").toString();
							// String UnionLengthFuncDec =
							// jObjectArray.getJSONObject(i).get("UnionLengthFuncDec")
							// .toString();
							String UnionLengthFuncEX = jObjectArray.getJSONObject(i).get("UnionLengthFuncEX")
									.toString();
							String IntersectionLengthCallExp = jObjectArray.getJSONObject(i)
									.get("IntersectionLengthCallExp").toString();
							String UnionLengthCallEX = jObjectArray.getJSONObject(i).get("UnionLengthCallEX")
									.toString();
							String libName = jObjectArray.getJSONObject(i).get("libName").toString();
							if (libName.equals("mediaelement"))
								continue;

							if (IntersectionLengthCallExp.equals(UnionLengthFuncEX)
									&& IntersectionLengthFuncEx.equals(UnionLengthFuncEX)) {

								// libsetJDZero.add(libName);
								// &&
								// IntersectionLengthCallExp.equals(UnionLengthCallEX))
								// {
								res.put("Result", "ok");
								// res.put("IntersectionLengthFuncDec",
								// IntersectionLengthFuncDec);
								res.put("IntersectionLengthFuncEx", IntersectionLengthFuncEx);
								// res.put("UnionLengthFuncDec",
								// UnionLengthFuncDec);
								res.put("UnionLengthFuncEX", UnionLengthFuncEX);
								res.put("UnionLengthCallEX", UnionLengthCallEX);
								res.put("IntersectionLengthCallExp", IntersectionLengthCallExp);
								res.put("JaccardDistanceFuncEx", "0");
								res.put("JaccardDistanceFuncDec", "0");
								res.put("JaccardDistanceCallExp", "0");
								res.put("url", jObjectArray.getJSONObject(i).get("url").toString());
								res.put("version", jObjectArray.getJSONObject(i).get("version"));

								res.put("libName", jObjectArray.getJSONObject(i).get("libName").toString());

								try {
									if (null != jObjectArray.getJSONObject(i).get("libHomePage"))
										res.put("libHomePage",
												jObjectArray.getJSONObject(i).get("libHomePage").toString());
								} catch (JSONException e) {
									res.put("libHomePage", "");
								}

								try {
									if (null != jObjectArray.getJSONObject(i).get("libDescription"))
										res.put("libDescription",
												jObjectArray.getJSONObject(i).get("libDescription").toString());
								} catch (JSONException e) {
									res.put("libDescription", "");
								}

								log.debug("Match Found! to ZERO" + jObjectArray.getJSONObject(i).get("url").toString());
								break;

							} else {
								float tempJDfx = computeJaccardDistance(IntersectionLengthFuncEx, UnionLengthFuncEX);
								// float tempJDDec =
								// computeJaccardDistance(IntersectionLengthFuncDec,
								// UnionLengthFuncDec);
								float tempJDCallEx = computeJaccardDistance(IntersectionLengthCallExp,
										UnionLengthCallEX);

								log.debug("Match Found! to FRA" + jObjectArray.getJSONObject(i).get("url").toString());

								// System.out.println("tempJDfx " + tempJDfx + "
								// tempJDDec" + tempJDDec);
								// + " tempJDCallEx " + tempJDCallEx);

								if (tempJDfx <= minJDFx && tempJDCallEx <= minJDCallExp) {// &&
									// tempJDCallEx
									// <=
									// minJDCallExp)
									// {
									minJDFx = tempJDfx;
									// minJDDec = tempJDDec;
									minJDCallExp = tempJDCallEx;
									res = new JSONObject();
									res.put("Result", "ok");
									// res.put("IntersectionLengthFuncDec",
									// IntersectionLengthFuncDec);
									res.put("IntersectionLengthFuncEx", IntersectionLengthFuncEx);
									// res.put("UnionLengthFuncDec",
									// UnionLengthFuncDec);
									res.put("UnionLengthFuncEX", UnionLengthFuncEX);
									res.put("UnionLengthCallEX", UnionLengthCallEX);
									res.put("IntersectionLengthCallExp", IntersectionLengthCallExp);
									res.put("JaccardDistanceFuncEx", String.valueOf(tempJDfx));
									// res.put("JaccardDistanceFuncDec",
									// String.valueOf(tempJDDec));
									res.put("JaccardDistanceCallExp", String.valueOf(tempJDCallEx));
									res.put("url", jObjectArray.getJSONObject(i).get("url").toString());
									res.put("version", jObjectArray.getJSONObject(i).get("version")); // resultList.add(res);
									res.put("libName", jObjectArray.getJSONObject(i).get("libName").toString());
									try {
										if (null != jObjectArray.getJSONObject(i).get("libHomePage"))
											res.put("libHomePage",
													jObjectArray.getJSONObject(i).get("libHomePage").toString());
									} catch (JSONException e) {
										res.put("libHomePage", "");
									}

									try {

										if (null != jObjectArray.getJSONObject(i).get("libDescription"))
											res.put("libDescription",
													jObjectArray.getJSONObject(i).get("libDescription").toString());
									} catch (JSONException e) {
										res.put("libDescription", "");

									}

								}

							}

							// System.out.println(jObjectArray.getJSONObject(i).get("IntersectionLengthFuncDec"));
						}
						// System.out.println("Match Found!" +
						// res.getLibName());

					} else {

						res.put("Result", "none");
					}

					if (res.get("Result").equals("ok")) {
						if ((Float.parseFloat((String) res.get("JaccardDistanceFuncEx")) < .5)
								|| (Float.parseFloat((String) res.get("JaccardDistanceCallExp")) < .5)) {

							if (en != null) {
								en.getContent().close();
							}
							response.close();
							client.getConnectionManager().closeIdleConnections(0, TimeUnit.MINUTES);
							client.close();
							return res;
						}

					}

					else {

						if (en != null) {
							en.getContent().close();
						}
						response.close();
						client.getConnectionManager().closeIdleConnections(0, TimeUnit.MINUTES);
						client.close();
						return null;
					}

					// return (res);

				} else {
					res.put("Result", "none");
				}

				// HACK
				// res.put("Result", "ok");

			} else {
				if (en != null) {
					en.getContent().close();
				}
				response.close();
				client.getConnectionManager().closeIdleConnections(0, TimeUnit.MINUTES);
				client.close();

				return null;

			}
			// JSONObject error = new JSONObject();
			// error.put("Error", response.getStatusLine().toString());

			if (en != null) {
				en.getContent().close();
			}
			response.close();
			client.getConnectionManager().closeIdleConnections(0, TimeUnit.MINUTES);
			client.close();

			return null;

		}
	}

	private static float computeJaccardDistance(String intersection, String union) {
		if (Float.parseFloat(intersection) == 0.0) {
			return (float) 1.0;
		} else if (Float.parseFloat(union) == 0.0) {
			return (float) 1.0;
		} else {
			float distance = 1 - (Float.parseFloat(intersection) / Float.parseFloat(union));
			return distance;
		}

	}

	@Override
	public JsonNode transferIpaToDisk(IosApp appWithIpa) {
		try {
			workCacheManager.logWorkCacheState();
			File tempDir = new File(workCacheManager.getWorkerBaseDir() + System.getProperty("file.separator")
					+ "ExtractedApp" + System.getProperty("file.separator"));
			tempDir.mkdirs();
			// tempDir.createNewFile();
			Path extractedPath = Paths.get(tempDir.getPath());

			workCacheManager.setExtractedBundlePath(extractedPath);
			unzipArchive(workCacheManager.getIpaPath().toString(),
					workCacheManager.getExtractedBundlePath().toString());

			log.debug("Starting: extractedPath" + extractedPath.toString());
			String libPath = getLibraryNames(extractedPath.toString());
			log.debug("LibPath: {}", libPath);

			File localResult = new File(libPath);
			ObjectMapper mapper = new ObjectMapper();
			JsonNode root = mapper.readTree(localResult);
			// localResult
			localResult.delete();

			// localResult.delete();
			// IndicatorJSON libs=new IndicatorJSON(name, testid, app, detail,
			// n)
			return root;
		} catch (Exception e) {
			e.printStackTrace();
			log.error("Error during unzipping IPA: {}", e);
			throw new FatalAppCheckException("Error during unzipping IPA");
		}

	}

	@Override
	public void startAppSession(IosApp app) {
		log.debug("Starting: startAppSession");

		if (ClientSession.getClientSession().getData() == null) {
			String randomId = getRandomId();

			// Check for existing "random"-Ids, if ID already exists, generate a
			// new one and check again
			while (workCacheManager.checkSessionId(randomId)) {
				randomId = getRandomId();
			}

			ClientSession.getClientSession().setData(workCacheManager.initializeCache(app, randomId));
			log.debug("Current ClientSessionId: {}", ClientSession.getClientSession().clientId);

			ClientSession.addSessionDeleteHandler(new Runnable() {

				@Override
				public void run() {
					ClientSession.deleteClientSession();
					workCacheManager.deinitializeCache();
				}
			});
		}

		log.debug("WorkCacheManager initial state:");
		// workCacheManager.logWorkCacheState();
	}

	@Override
	public void endAppSession(IosApp app) {
		log.debug("Starting: endAppSession");
		if (ClientSession.existsClientSession()) {
			log.debug("Starting: deleteClientSession");
			workCacheManager.deinitializeCache();
			ClientSession.deleteClientSession();
		}
	}

	/**
	 * Internal helper for generating a random MD5 Hash (without padding)
	 * 
	 * @return String sessionID
	 * @throws IOException
	 */
	private String getRandomId() {
		String sessionID = "";
		try {
			// Generate randomNumber
			Random rng = new Random();
			int randomNumber = rng.nextInt();

			// Generate MD5-Hash of randomNumber
			MessageDigest md;
			md = MessageDigest.getInstance("MD5");

			// Convert int to byte
			ByteArrayOutputStream bos = new ByteArrayOutputStream();
			ObjectOutput out = new ObjectOutputStream(bos);
			out.writeInt(randomNumber);
			out.close();
			byte[] intBytes = bos.toByteArray();
			bos.close();

			// set sessionID and return
			byte[] messageDigest = md.digest(intBytes);
			BigInteger number = new BigInteger(1, messageDigest);
			sessionID = number.toString(16);
		} catch (NoSuchAlgorithmException | IOException e) {
			e.printStackTrace();
		}
		return sessionID;
	}

	/**
	 * Internal function for unzipping files
	 * 
	 * @param inputZip
	 * @param outputDir
	 */
	private void unzipIt(String inputZip, String outputDir) {
		// log.debug("Start: unzipIt");
		// log.debug("Start: inputZip" + inputZip);
		log.debug("Start: outputDir" + outputDir);

		byte[] buffer = new byte[1024];

		try {

			// create output directory is not exists
			File folder = new File(outputDir);
			if (!folder.exists()) {
				folder.mkdir();
			}

			// get the zip file content
			ZipInputStream zis = new ZipInputStream(new FileInputStream(inputZip));
			// get the zipped file list entry
			ZipEntry ze = zis.getNextEntry();

			while (ze != null) {

				String fileName = ze.getName();
				if (!isFilenameValid(outputDir + File.separator + fileName)) {
					ze = zis.getNextEntry();
					continue;
				}

				File newFile = new File(outputDir + File.separator + fileName);

				// System.out.println("file unzip : " +
				// newFile.getAbsoluteFile());

				if (ze.isDirectory()) {
					newFile.mkdirs();
				} else {
					try {

						FileOutputStream fos = new FileOutputStream(newFile);

						int len;
						while ((len = zis.read(buffer)) > 0) {
							fos.write(buffer, 0, len);
						}

						fos.close();

					} catch (FileNotFoundException ex) {
						log.error("File not found: {}", inputZip);
					}

				}
				ze = zis.getNextEntry();
			}

			zis.closeEntry();
			zis.close();

			// log.debug("Done");

		} catch (IOException ex) {
			log.error("Failed to unzip file: {}", inputZip);
			ex.printStackTrace();
		}
	}

	/**
	 * UnzipWrapperMethod Checks input file for compression, decompresses if
	 * needet and unzips the given archive to its destination In case of
	 * compression, a file "<inputZip>_uncompressed" will be generated
	 * 
	 * @param inputZip
	 * @param outputDir
	 */
	private void unzipArchive(String inputZip, String outputDir) {
		log.debug("Start: unzipArchive");

		String newInputZip = inputZip;
		if (isGzipped(new File(inputZip))) {
			// GZIP
			newInputZip = outputDir + "_uncompressed";

			if (inputZip == workCacheManager.getIpaPath().toString()) {
				workCacheManager.setIpaPath(Paths.get(newInputZip));
			}

			gunzipIt(inputZip, newInputZip);
		}
		// ZIP
		unzipIt(newInputZip, outputDir);
	}

	/**
	 * Internal helper for checking the first two bytes of a file for a gzip
	 * signature
	 * 
	 * @param f
	 * @return true if input file is gzip compressed
	 */
	private boolean isGzipped(File f) {
		InputStream is = null;
		try {
			is = new FileInputStream(f);
			byte[] signature = new byte[2];
			int nread = is.read(signature);
			is.close();
			return nread == 2 && signature[0] == (byte) 0x1f && signature[1] == (byte) 0x8b;
		} catch (IOException e) {
			e.printStackTrace();
			return false;
		}
	}

	/**
	 * Internal function for uncompressing gzipped files
	 * 
	 * @param inputZip
	 * @param outputFile
	 */
	private void gunzipIt(String inputZip, String outputFile) {
		// log.debug("Starting: gunzipIt");

		byte[] buffer = new byte[1024];

		try {

			GZIPInputStream gzis = new GZIPInputStream(new FileInputStream(inputZip));

			FileOutputStream out = new FileOutputStream(outputFile);

			int len;
			while ((len = gzis.read(buffer)) > 0) {
				out.write(buffer, 0, len);
			}

			gzis.close();
			out.close();

		} catch (IOException ex) {
			log.error("Failed to decompress file with gunzip : {}", inputZip);
			ex.printStackTrace();
		}
	}

	private static boolean isFilenameValid(String file) {
		File f = new File(file);
		try {
			f.getCanonicalPath();
			return true;
		} catch (IOException e) {
			return false;
		}

	}
}
