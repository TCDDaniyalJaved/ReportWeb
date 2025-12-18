using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.VisualStudio.Web.CodeGenerators.Mvc.Templates.Blazor;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Accounting.Models;

namespace Accounting.ViewModel
{
    public class AccountOpeningSPResult
    {
        public AccountOpeningMview Master { get; set; }

        public List<AccountOpeningDview> Details { get; set; }




        public AccountOpeningSPResult()
        {
            Master = new AccountOpeningMview();
            Details = new List<AccountOpeningDview>();
        }
    }


}