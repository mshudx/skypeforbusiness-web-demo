using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

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
