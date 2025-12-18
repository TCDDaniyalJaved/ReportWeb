using Microsoft.AspNetCore.Mvc.Rendering;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Accounting.Models;

namespace Accounting.ViewModel
{
    public class SaleInvoiceViewModel
    {
        public SaleInvoiceMaster Master { get; set; } = new SaleInvoiceMaster();
        public List<SaleInvoiceDetail> LineItems { get; set; } = new();

    }
}
