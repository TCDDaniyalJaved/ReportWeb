using Microsoft.AspNetCore.Mvc.Rendering;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Accounting.Models;

namespace Accounting.ViewModel
{
    public class BankReceiptViewModel
    {
        public BankReceiptM Master { get; set; }
        public List<BankReceiptD> Details { get; set; }

        public BankReceiptViewModel()
        {
            Master = new BankReceiptM();
            Details = new List<BankReceiptD>();
        }
    }

}
