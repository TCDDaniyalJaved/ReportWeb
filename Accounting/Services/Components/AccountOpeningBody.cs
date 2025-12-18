using QuestPDF.Fluent;
using QuestPDF.Infrastructure;
using Accounting.ViewModel;

namespace Accounting.Services.Pdf.Components
{
    public class AccountOpeningBody : IComponent
    {
        private readonly AccountOpeningSPResult _model;

        public AccountOpeningBody(AccountOpeningSPResult model)
        {
            _model = model;
        }

        public void Compose(IContainer container)
        {
            container.Table(table =>
            {
                table.ColumnsDefinition(c =>
                {
                    c.RelativeColumn(2);
                    c.RelativeColumn(1);
                    c.RelativeColumn(1);
                });

                // Header
                table.Header(header =>
                {
                    header.Cell().Element(HeaderStyle).Text("Account Name / Description").Bold();
                    header.Cell().Element(HeaderStyle).AlignRight().Text("Debit").Bold();
                    header.Cell().Element(HeaderStyle).AlignRight().Text("Credit").Bold();
                });

                // Body rows
                foreach (var d in _model.Details)
                {
                    table.Cell().Element(CellStyle).Text(d.Accounts);
                    table.Cell().Element(CellStyle).AlignRight().Text($"{d.Debit:N2}");
                    table.Cell().Element(CellStyle).AlignRight().Text($"{d.Credit:N2}");
                }

                // Total row
                table.Cell().Element(TotalStyle).Text("Total Amount").Bold();
                table.Cell().Element(TotalStyle).AlignRight().Text($"{_model.Details.Sum(x => x.Debit ?? 0):N2}").Bold();
                table.Cell().Element(TotalStyle).AlignRight().Text($"{_model.Details.Sum(x => x.Credit ?? 0):N2}").Bold();
            });
        }

        IContainer HeaderStyle(IContainer container)
        {
            return container.Background("#F2F2F2").Padding(5).BorderBottom(1).BorderColor("#CCCCCC");
        }

        IContainer CellStyle(IContainer container)
        {
            return container.Padding(5).BorderBottom(1).BorderColor("#EAEAEA");
        }

        IContainer TotalStyle(IContainer container)
        {
            return container.Background("#F2F2F2").Padding(5).BorderTop(1).BorderColor("#BBBBBB");
        }
    }
}
