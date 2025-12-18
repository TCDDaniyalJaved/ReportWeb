using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.VisualStudio.Web.CodeGenerators.Mvc.Templates.Blazor;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Accounting.Models;

namespace Accounting.ViewModel
{
    public class AccountOpeningViewModel
    {
        public AccountOpeningM Master { get; set; }

        public List<AccountOpeningD> Details { get; set; }




        public AccountOpeningViewModel()
        {
            Master = new AccountOpeningM();
            Details = new List<AccountOpeningD>();
        }
    }

}