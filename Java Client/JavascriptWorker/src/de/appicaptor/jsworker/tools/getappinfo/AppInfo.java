package de.appicaptor.jsworker.tools.getappinfo;

import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Container class for deserialized AppInfo provided by the {@code getappinfo} utility
 * @author rueckrie
 *
 */
/*
 * Example data structure current as of 20150928 (v0.0.2)
{
  "MinimumSystemVersion" : "8.0",
  "ApplicationDSID" : "1723541292",
  "ApplicationType" : "User",
  "DataContainerURL" : "/private/var/mobile/Containers/Data/Application/86BDC0F3-6AAD-4990-AB9B-7D220D2EA743",
  "BundleExecutable" : "smartPay",
  "ShortVersionString" : "1.0.0",
  "BundleURL" : "/private/var/mobile/Containers/Bundle/Application/C765CC95-D6F4-405A-8335-4E490256FD90/smartPay.app",
  "VendorName" : null,
  "BundleContainerURL" : "/private/var/mobile/Containers/Bundle/Application/C765CC95-D6F4-405A-8335-4E490256FD90",
  "SDKVersion" : "8.3",
  "DeviceFamily" : [
    1
  ],
  "BundleIdentifier" : "de.comdirect.SmartPay",
  "SourceAppIdentifier" : "com.apple.AppStore",
  "LocalizedName" : "smartPay",
  "ContainerURL" : "/private/var/mobile/Containers/Data/Application/86BDC0F3-6AAD-4990-AB9B-7D220D2EA743",
  "GroupContainerURLs" : {

  },
  "Entitlements" : {
    "com.apple.developer.team-identifier" : "U829YNWB46",
    "application-identifier" : "U829YNWB46.de.comdirect.SmartPay",
    "keychain-access-groups" : [
      "U829YNWB46.de.comdirect.SmartPay"
    ]
  },
  "BundleVersion" : "6"
}
 */
public class AppInfo {

	@JsonProperty("MinimumSystemVersion")
	protected String minimumSystemVersion;

	@JsonProperty("ApplicationDSID")
	protected String applicationDsid;

	@JsonProperty("ApplicationType")
	protected String applicationType;

	@JsonProperty("DataContainerURL")
	protected String dataContainerPath;

	@JsonProperty("ShortVersionString")
	protected String shortVersionString;

	@JsonProperty("BundleURL")
	protected String bundlePath;

	@JsonProperty("VendorName")
	protected String vendorName;

	@JsonProperty("BundleContainerURL")
	protected String bundleContainerPath;

	@JsonProperty("SDKVersion")
	protected String sdkVersion;

	@JsonProperty("DeviceFamily")
	protected List<Integer> deviceFamily;

	@JsonProperty("BundleIdentifier")
	protected String bundleIdentifier;

	@JsonProperty("SourceAppIdentifier")
	protected String sourceAppIdentifier;

	@JsonProperty("BundleExecutable")
	protected String bundleExecutable;

	@JsonProperty("ContainerURL")
	protected String containerPath;

	@JsonProperty("GroupContainerURLs")
	protected Map<String, String> groupContainerPaths;

	@JsonProperty("LocalizedName")
	protected String localizedName;

	@JsonProperty("Entitlements")
	protected Map<String, Object> entitlements;

	@JsonProperty("BundleVersion")
	protected String bundleVersion;

	public AppInfo() {
		super();
	}

	public AppInfo(String minimumSystemVersion, String applicationDsid, String applicationType,
			String dataContainerPath, String shortVersionString, String bundlePath, String vendorName,
			String bundleContainerPath, String sdkVersion, List<Integer> deviceFamily, String bundleIdentifier,
			String sourceAppIdentifier, String bundleExecutable, String containerPath,
			Map<String, String> groupContainerPaths, String localizedName, Map<String, Object> entitlements,
			String bundleVersion) {
		super();
		this.minimumSystemVersion = minimumSystemVersion;
		this.applicationDsid = applicationDsid;
		this.applicationType = applicationType;
		this.dataContainerPath = dataContainerPath;
		this.shortVersionString = shortVersionString;
		this.bundlePath = bundlePath;
		this.vendorName = vendorName;
		this.bundleContainerPath = bundleContainerPath;
		this.sdkVersion = sdkVersion;
		this.deviceFamily = deviceFamily;
		this.bundleIdentifier = bundleIdentifier;
		this.sourceAppIdentifier = sourceAppIdentifier;
		this.bundleExecutable = bundleExecutable;
		this.containerPath = containerPath;
		this.groupContainerPaths = groupContainerPaths;
		this.localizedName = localizedName;
		this.entitlements = entitlements;
		this.bundleVersion = bundleVersion;
	}

	public String getMinimumSystemVersion() {
		return minimumSystemVersion;
	}

	public void setMinimumSystemVersion(String minimumSystemVersion) {
		this.minimumSystemVersion = minimumSystemVersion;
	}

	public String getApplicationDsid() {
		return applicationDsid;
	}

	public void setApplicationDsid(String applicationDsid) {
		this.applicationDsid = applicationDsid;
	}

	public String getApplicationType() {
		return applicationType;
	}

	public void setApplicationType(String applicationType) {
		this.applicationType = applicationType;
	}

	public String getDataContainerPath() {
		return dataContainerPath;
	}

	public void setDataContainerPath(String dataContainerPath) {
		this.dataContainerPath = dataContainerPath;
	}

	public String getShortVersionString() {
		return shortVersionString;
	}

	public void setShortVersionString(String shortVersionString) {
		this.shortVersionString = shortVersionString;
	}

	public String getBundlePath() {
		return bundlePath;
	}

	public void setBundlePath(String bundlePath) {
		this.bundlePath = bundlePath;
	}

	public String getVendorName() {
		return vendorName;
	}

	public void setVendorName(String vendorName) {
		this.vendorName = vendorName;
	}

	public String getBundleContainerPath() {
		return bundleContainerPath;
	}

	public void setBundleContainerURL(String bundleContainerURL) {
		this.bundleContainerPath = bundleContainerURL;
	}

	public String getSdkVersion() {
		return sdkVersion;
	}

	public void setSdkVersion(String sdkVersion) {
		this.sdkVersion = sdkVersion;
	}

	public List<Integer> getDeviceFamily() {
		return deviceFamily;
	}

	public void setDeviceFamily(List<Integer> deviceFamily) {
		this.deviceFamily = deviceFamily;
	}

	public String getBundleIdentifier() {
		return bundleIdentifier;
	}

	public void setBundleIdentifier(String bundleIdentifier) {
		this.bundleIdentifier = bundleIdentifier;
	}

	public String getSourceAppIdentifier() {
		return sourceAppIdentifier;
	}

	public void setSourceAppIdentifier(String sourceAppIdentifier) {
		this.sourceAppIdentifier = sourceAppIdentifier;
	}

	public String getBundleExecutable() {
		return bundleExecutable;
	}

	public void setBundleExecutable(String bundleExecutable) {
		this.bundleExecutable = bundleExecutable;
	}

	public String getContainerPath() {
		return containerPath;
	}

	public void setContainerPath(String containerPath) {
		this.containerPath = containerPath;
	}

	public Map<String, String> getGroupContainerPaths() {
		return groupContainerPaths;
	}

	public void setGroupContainerPaths(Map<String, String> groupContainerPaths) {
		this.groupContainerPaths = groupContainerPaths;
	}

	public String getLocalizedName() {
		return localizedName;
	}

	public void setLocalizedName(String localizedName) {
		this.localizedName = localizedName;
	}

	public Map<String, Object> getEntitlements() {
		return entitlements;
	}

	public void setEntitlements(Map<String, Object> entitlements) {
		this.entitlements = entitlements;
	}

	public String getBundleVersion() {
		return bundleVersion;
	}

	public void setBundleVersion(String bundleVersion) {
		this.bundleVersion = bundleVersion;
	}

	public void setBundleContainerPath(String bundleContainerPath) {
		this.bundleContainerPath = bundleContainerPath;
	}

}
