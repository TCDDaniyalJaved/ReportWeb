using System;
using System.Collections.Generic;

namespace Accounting.Models;

public  class PageHeaderVM
{
    public string Title { get; set; }
    public string NewButtonText { get; set; } = "New";
    public string SearchPlaceholder { get; set; }
}