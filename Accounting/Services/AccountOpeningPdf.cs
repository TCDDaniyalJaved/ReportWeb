using QuestPDF.Fluent;
using QuestPDF.Infrastructure;
using Accounting.ViewModel;
using Accounting.Services.Pdf.Components;

namespace Accounting.Services.Pdf
{
    public class AccountOpeningPdf : IDocument
    {
        private readonly AccountOpeningSPResult _model;

        public AccountOpeningPdf(AccountOpeningSPResult model)
        {
            _model = model;
        }

        public DocumentMetadata GetMetadata() => new DocumentMetadata();

        public void Compose(IDocumentContainer container)
        {
            container.Page(page =>
            {
                page.Margin(40);

                page.Header().Component(new ReportHeader(
                    _model.Master.Companyname,
                    "Account Opening Balance",
                    _model.Master.VoucherNo,
                    _model.Master.Date?.ToString("dd MMMM, yyyy")
                ));

                page.Content().Component(new AccountOpeningBody(_model));

                page.Footer().Component(new ReportFooter());
            });
        }
    }
}
