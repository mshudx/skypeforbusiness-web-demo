# About
This sample ASP.NET Core Web App shows how to develop a [Skype Web SDK](https://msdn.microsoft.com/en-us/skype/websdk/generalreference) client application for Skype for Business Online.

[![Twitter Follow](https://img.shields.io/twitter/follow/shields_io.svg?style=social&label=Follow&maxAge=2592000)](https://twitter.com/ersekattila)
[![Build status](https://ci.appveyor.com/api/projects/status/i0j9jo8sk1vf1sew?svg=true)](https://ci.appveyor.com/project/retk/skypeforbusiness-web-demo)

# Currently supported browsers

* IE 10+ (Skype for Business Onprem)
* IE 11 (Skype for Business Online)
* Safari 8+
* Firefox 40+ (non Audio Video functionality)
* Chrome 43+ (non Audio Video functionality)
* Microsoft Edge

# How-to setup your dev environment
To run this sample you will need:

* [.NET Core & .NET Core SDK RC2 releases](https://www.microsoft.com/net/download)
* [ASP.NET Core RC2 release](https://blogs.msdn.microsoft.com/webdev/2016/05/16/announcing-asp-net-core-rc2/)
* [Visual Studio 2015 Update 2](https://www.visualstudio.com/en-us/downloads/visual-studio-2015-downloads-vs.aspx)
* An Azure subscription (a free trial is sufficient)
* An Office365 subscription (a free trial is sufficient)

## Step-by-step guide

- [ ] Fork and clone or download this repository
- [ ] Obtain API key from the official documentation
- [ ] Register your APP in Azure AD 
- [ ] Configure your app for OAuth implicit grant flow
- [ ] Provide consent for all users in the Azure AD tenant
- [ ] Configure your application

# Configure the application

1. Open the solution in **Visual Studio 2015**
2. Open `appsettings.json` file
3. Find the `Authentication:AzureAd:ClientId` and replace the value with the **CLIENT ID** from the [Azure portal Active Directory extension](https://manage.windowsazure.com/@scaleddomains.com#Workspaces/ActiveDirectoryExtension).
4. Find the `Authentication:AzureAd:ClientSecret` and replace the value with a key created for the application in the Azure AD tenant. Under the Keys section, select either a 1 year or 2 year key - the keyValue will be displayed after you save the configuration at the end.
5. Replace the value of the `Authentication:AzureAd:AADInstance` setting with your Azure AD Tenant's domain name e.g. `contoso.onmicrosoft.com`
6. Set the value of `SkypeForBusiness:Version` to a specific value to your app, eg. `s4bdemo/0.0.1`
7. Set the Skype Web SDK API keys

> Alternatively you can save your sensitive configuration values to `secrets.json` file which is ignored by `.gitignore`.

# Skype Web SDK Production Use Capabilities & API keys
For the API product keys and the supported capabilitites please check the [Official documentation](https://msdn.microsoft.com/en-us/skype/websdk/apiproductkeys).
> This sample requires features that are available only in the **Public Preview (PP)** API version!

# App registration
Skype for Business Online uses Azure Active Directory (Azure AD) to provide authentication services that your application can 
use to obtain rights to access the service APIs. To accomplish this, your application needs to perform the following steps:

1. **Register your application in Azure AD.** To allow your application access to the Skype Web SDK APIs, you need to register your application in Azure AD. This will allow you to establish an identity for your application and specify the permission levels it needs in order to access the APIs. For details, see Registering your application in Azure AD.
2. **Add a sign in feature to your app.** When a user visits your website and initiates sign-in, your application makes a request to the Microsoft common OAuth2 login endpoint. Azure AD validates the request and responds with a sign-in page, where the user signs in. A use must explicitly grant consent to allow your application to access user data by means of the Skype Web SDK APIs. The user reads the descriptions of the access permissions that your application is requesting, and then grants or denies the request. After consent is granted, the UI redirects the user back to your application. If authentication and authorization are successful, Azure AD returns a token and grants access to SfB Online and identifies the current signed-in user. For details on authentication, see [Authentication using Azure AD](https://msdn.microsoft.com/en-us/library/office/mt590891(v=office.16).aspx). For details of authorization, see [Skype for Business Online scope permissions](https://msdn.microsoft.com/en-us/library/office/mt590791(v=office.16).aspx).
3. **Call the Skype Web SDK APIs.** Your application passes access tokens to the Skype Web SDK APIs to authenticate and authorize your application.

## Registering your application in Azure AD
Sign in to the [Azure Management Portal](http://manage.windowsazure.com), then do the following:

1. Click the **Active Directory** node in the left column and select the directory linked to your Skype for Business subscription.
2. Select the **Applications** tab and then **Add** at the bottom of the screen.
3. Select **Add an application my organization is developing**.
4. Choose a name for your application, such as `skypewebsample`, and select **Web application and/or web API** as its **Type**. Click the arrow to continue.
5. The value of **Sign-on URL** is the URL at which your application is hosted.
6. The value of **App ID URI** is a unique identifier for Azure AD to identify your application. You can use `http://{your_subdomain}/skypewebsample`, where `{your_subdomain}` is the subdomain of `.onmicrosoft.com` you specified while signing up for your Skype for Business Web App (website) on Azure. Click the check mark to provision your application.
7. Select the **Configure** tab, scroll down to the **Permissions** to other applications section, and click the **Add application** button.
8. In order to show how to create online meetings, add the **Skype for Business Online** application. Click the plus sign in the application's row and then click the check mark at the top right to add it. Then click the check mark at the bottom right to continue.
9. In the **Skype for Business Online** row, select **Delegated Permissions**, and in the selection list, choose **Create Online Meetings**.
10. OPTIONAL: Select **Application is Multi-Tenant** to configure the application as a multi-tenant application.
11. Click **Save** to save the application's configuration.

These steps register your application with Azure AD, but you still need to configure your app's manifest to use OAuth implicit grant flow, as explained below.

## Configure your app for OAuth implicit grant flow
In order to get an access token for Skype for Business API requests, your application will use the OAuth implicit grant flow. 
You need to update the application's manifest to allow the OAuth implicit grant flow because it is not allowed by default.

1. Select the **Configure** tab of your application's entry in the **Azure Management Portal**.
2. Using the **Manage Manifest** button in the drawer, download the manifest file for the application and save it to your computer.
3. Open the manifest file with a text editor. Search for the `oauth2AllowImplicitFlow` property. By default it is set to `false`; change it to `true` and save the file.
4. Using the **Manage Manifest** button, upload the updated manifest file.

This will register your application with Azure AD. In order for your Skype Web application to access Skype for Business Server resources (such as messaging or presence), it needs to obtain an access token using implicit grant flow. This token gives the application permission to access the resource.

# Tenant Administrator Consent Flow
The **Skype for Business Online** permissions are tenant administrator consent only. 
For an app to be used by all users of an O365 tenant, a tenant administrator must provide consent. 
To provide consent for all users in the tenant, construct the following URL for your app as shown in the example below:


```
https://login.microsoftonline.com/common/oauth2/authorize?response_type=id_token&client_id=<<clientid>>&redirect_uri=<<redirecturi>>&response_mode=form_post&nonce=a4014117-28aa-47ec-abfb-f377be1d3cf5&resource=https://webdir.online.lync.com&prompt=admin_consent
```

> Note: Update the client Id and redirect Uri for your app.

Access the URL and authenticate using **tenant administrator credentials** and **accept the application permissions**. Users will now be able to access the application.

# Development Tips&Tricks

## Adding Chrome Incognito Mode as a Browser

1. In **Visual Studio**, select the drop-down arrow to the right of the debug target & browser choice dropdown
2. Select **Browse with**
3. Click on **Add**
4. Add Chrome from either it's standard or user location:
	* System: C:\Program Files (x86)\Google\Chrome\Application\
	* User: C:\Users\UserName\AppData\Local\Google\Chrome\Application
5. Then add `--incognito` as command line switch and name the browser something like "Google Chrome - Incognito."

## Adding Internet Explorer Private Mode as Browser

1. In **Visual Studio**, select the drop-down arrow to the right of the debug target & browser choice dropdown
2. Select **Browse with**
3. Click on **Add**
4. Add **Internet Explorer** from `C:\Program Files\Internet Explorer\iexplore.exe`
5. Then add `--incognito` as command line switch and name the browser something like "Internet Explorer - Private."
