using QuestPDF.Fluent;
using QuestPDF.Infrastructure;
using QuestPDF.Helpers;

namespace Accounting.Services.Pdf.Components
{
    public class ReportHeader : IComponent
    {
        private readonly string _companyName;
        private readonly string _title;
        private readonly string _voucherNo;
        private readonly string _voucherDate;

        public ReportHeader(string companyName, string title, string voucherNo, string voucherDate)
        {
            _companyName = companyName;
            _title = title;
            _voucherNo = voucherNo;
            _voucherDate = voucherDate;
        }

        public void Compose(IContainer container)
        {
            container.Column(col =>
            {
                col.Item().Text(_companyName).Bold().FontSize(20).FontColor(Colors.Blue.Darken2);
                col.Item().Text(_title).Bold().FontSize(14);

                col.Item().PaddingTop(10).Table(table =>
                {
                    table.ColumnsDefinition(c =>
                    {
                        c.RelativeColumn(1);
                        c.RelativeColumn(1);
                        c.RelativeColumn(1);
                        c.RelativeColumn(1);
                    });

                    table.Cell().Element(CellStyle).Text("Voucher #:").Bold();
                    table.Cell().Element(CellStyle).Text(_voucherNo);

                    table.Cell().Element(CellStyle).Text("Voucher Date:").Bold();
                    table.Cell().Element(CellStyle).Text(_voucherDate);
                });
            });
        }

        IContainer CellStyle(IContainer container)
        {
            return container.Padding(5).Border(1).BorderColor("#DDDDDD");
        }
    }
}
