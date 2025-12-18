using QuestPDF.Fluent;
using QuestPDF.Infrastructure;

namespace Accounting.Services.Pdf.Components
{
    public class ReportFooter : IComponent
    {
        public void Compose(IContainer container)
        {
            container.PaddingTop(40).Row(row =>
            {
                row.RelativeItem().Column(col =>
                {
                    col.Item().AlignCenter().Text("Prepared By").FontSize(12);
                    col.Item().PaddingTop(5)
                        .Container()                  // Wrap in a container
                        .Width(150)
                        .AlignCenter()
                        .LineHorizontal(1);
                });

                row.RelativeItem().Column(col =>
                {
                    col.Item().AlignCenter().Text("Accountant").FontSize(12);
                    col.Item().PaddingTop(5)
                        .Container()
                        .Width(150)
                        .AlignCenter()
                        .LineHorizontal(1);
                });

                row.RelativeItem().Column(col =>
                {
                    col.Item().AlignCenter().Text("Approved By").FontSize(12);
                    col.Item().PaddingTop(5)
                        .Container()
                        .Width(150)
                        .AlignCenter()
                        .LineHorizontal(1);
                });
            });
        }
    }
}
