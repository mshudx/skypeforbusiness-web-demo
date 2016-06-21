using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Mshudx.S4bDemo.Web.Controllers
{
    public class HomeController : Controller
    {
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
