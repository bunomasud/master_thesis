# master_thesis
Master Thesis: Automatic Detection of Javascript Libraries in Hybrid Apps.
The ability to use JavaScript in mobile operating systems like Apple iOS and Google Android has opened the door to multi-platform support for mobile Apps, but it has also made them prone to attacks that were previously only possible in web applications. There are large numbers of JavaScript libraries out there and it is not deeply researched how many of them were built with secure practices. Additionally, little is known about their security as they are not analyzed or analysis are not publicly reported yet, except from some reported issues which can already be found in the public vulnerability databases like CVE [1] or NVD [2]. Very often developers do not care about the vulnerable JavaScript library version they use in their projects, most of them lack knowledge about the vulnerable JavaScript library version or simply do not care. This leads to a lot of them using these libraries ignoring e.g. their version number and vulnerabilities.  OWSAP has listed this insecure practice in its 2013 top 10 list as “Components with Known Vulnerabilities” [3]. Insecure library poses huge risk to software especially for mobile Apps where possibility of XSS attacks, broken access control or authentication token theft can successfully lead to absolute compromise of a user account or even a whole system. Also, presence of HTML and JavaScript files in the Apps as resource files makes it easy for the attacker to know exactly what vulnerable version of libraries is used and exploit their vulnerabilities, as the plain source code is exposed publicly. In defense, a tool that can detect the vulnerable library is required to warn App users about their possible security loop holes. The purpose of this thesis is to develop a tool that can automatically detect the JavaScript libraries and version number in large scale so that already reported vulnerabilities can be identified. Also a statistical overview of this problem for Hybrid Apps can be obtained to know how common this insecure practice exits in the wild. The knowledge of library usage is important also for further analysis, for example feature detection or static analysis for vulnerability detection. 

Approach: Some open source CDN providers like cdnjs.com and jsDeliver.com host most popular libraries and their available versions. Among these two, cdnjs.com hosts almost 2400 libraries and their versions which are available to download. Moreover, cdnjs.com provides API to get the list of files of libraries and versions which makes it possible to download them programmatically and do processing on them. Components of the proposed architecture will be following.

1.	Library downloader: This uses the cdsjs.com API to download the libraries hosted in cdnjs.com and put them into database. An auto updater keeps the database updated periodically.(CronTask.js)
2.	Fingerprint Generator: A fingerprint generator will process the downloaded file and generate the fingerprints for each files and put them into database.(master/child_Downloader.js)
3.	Matcher: A Node.js server which will provide the API to upload JavaScript files from the extracted app and return the approximate library name and version number based on the similarity detection technique.(NodeApi.js)

To conduct this research on a large scale, automatic downloading of the hybrid apps is also required. Appicaptor as a framework has this feature to be able to download the apps programmatically from both Play Store and iTunes.  As a part of the Appicaptor(https://www.sit.fraunhofer.de/en/appicaptor/ ) architecture, A JavaScript worker will accept JavaScript files extracted from
Hybrid Apps. The worker will then communicate with an API provided by the Matcher which will run the analysis based on the generated fingerprints on the extracted JavaScript files and in response provide the exact or partial match of a JavaScript library. 

How to Use it:


1. Run Cdn Js Api/apiServer.js with the command line node apiServer.Js. This reflects the api provided by api.cdnjs.com, but has been modified to be able work with fingerprint generator

2. Run Node Api/CronTask.js this will use the apiSrver.js and download "backbone.marionette","Trumbowyg","angular.js","backbone.js","angular-i18n","yui" libraries and generate fingerprint. Uncomment the for loop section to mirror the whole cndjs libraries. also a mongo Db URL needs to be provided. Here Cron task is scheduled to run evreyday at 18:35:15(Hour/min/Sec) Adjust the time before running it.

3. Run Node Api/NodeApi.js to use the file path to know the detected libraries.

4. Javascript worker is the sample java client that is using the NodeApi for analysis. CallToNodeAPI @JavaScriptWorker.java is a sample multithreaded implementation. 


