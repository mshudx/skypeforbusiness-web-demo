using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Clients.ActiveDirectory;

namespace Mshudx.S4bDemo.Web.Controllers
{
    public class HomeController : Controller
    {
        private readonly IConfigurationRoot configurationRoot;

        public HomeController(IConfigurationRoot configurationRoot)
        {
            this.configurationRoot = configurationRoot;
        }

        public IActionResult Index()
        {
            return View();
        }

        public IActionResult Error()
        {
            return View();
        }

        public async Task<IActionResult> PasswordJoin()
        {
            string authority = String.Format(CultureInfo.InvariantCulture, "https://login.microsoftonline.com/{0}", "MOD956047.onmicrosoft.com");
            var authContext = new AuthenticationContext(authority);
            var clientCredential = new ClientCredential("cb118e36-9e2c-4e36-a59e-1a9096297002", "Ojg6SluCKsT4GF6wdLq30rL1qxGmdR4yz4vZLG9U94I=");
            var result  = await authContext.AcquireTokenAsync("https://webdir0e.online.lync.com/", clientCredential);
            ViewData["token"] = result.AccessToken;
            return View();
        }

        public IActionResult AnonymousJoin()
        {
            return View();
        }

        [Authorize]
        public IActionResult CreateConferenceCall()
        {
            return View();
        }
    }
}
