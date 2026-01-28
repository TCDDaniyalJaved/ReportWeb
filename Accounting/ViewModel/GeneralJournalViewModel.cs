using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.VisualStudio.Web.CodeGenerators.Mvc.Templates.Blazor;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Accounting.Models;

namespace Accounting.ViewModel
{
    public class GeneralJournalViewModel
    {
        public GjournalM Master { get; set; }

        public List<GjournalD> Details { get; set; }




        public GeneralJournalViewModel()
        {
            Master = new GjournalM();
            Details = new List<GjournalD>();
        }
    }

}
