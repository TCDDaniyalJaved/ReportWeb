using Microsoft.AspNetCore.Mvc.Rendering;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Accounting.Models;

namespace Accounting.ViewModel
{
    public class CashPaymentViewModel
    {
        public CashPaymentM Master { get; set; }
        public List<CashPaymentD> Details { get; set; }

        public CashPaymentViewModel()
        {
            Master = new CashPaymentM();
            Details = new List<CashPaymentD>();
        }
    }

}
