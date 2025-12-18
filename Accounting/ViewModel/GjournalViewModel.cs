using Microsoft.AspNetCore.Mvc.Rendering;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Accounting.Models;

namespace Accounting.ViewModel
{
    public class GjournalViewModel
    {
        public GjournalM Master { get; set; }
        public List<GjournalD> Details { get; set; }

        public GjournalViewModel()
        {
            Master = new GjournalM();
            Details = new List<GjournalD>();
        }
    }

}
