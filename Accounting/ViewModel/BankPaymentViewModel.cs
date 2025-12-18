using Microsoft.AspNetCore.Mvc.Rendering;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Accounting.Models;

namespace Accounting.ViewModel
{
    public class BankPaymentViewModel
    {
        public BankPaymentM Master { get; set; }
        public List<BankPaymentD> Details { get; set; }

        public BankPaymentViewModel()
        {
            Master = new BankPaymentM();
            Details = new List<BankPaymentD>();
        }
    }

}
