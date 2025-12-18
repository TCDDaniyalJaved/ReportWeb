using Microsoft.AspNetCore.Mvc.Rendering;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Accounting.Models;

namespace Accounting.ViewModel
{
    public class CashReceiptViewModel
    {
        public CashReceiptM Master { get; set; }
        public List<CashReceiptD> Details { get; set; }

        public CashReceiptViewModel()
        {
            Master = new CashReceiptM();
            Details = new List<CashReceiptD>();
        }
    }

}
