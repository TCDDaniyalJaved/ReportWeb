using System;
using System.Diagnostics;
using System.IO;
using System.Threading.Tasks;

namespace Base.Services
{
    public class HtmlToPdfGenerator
    {
        public async Task<byte[]> GeneratePdfAsync(string htmlContent)
        {
            string htmlFile = Path.Combine(Path.GetTempPath(), Guid.NewGuid() + ".html");
            string pdfFile = Path.Combine(Path.GetTempPath(), Guid.NewGuid() + ".pdf");

            try
            {
                // Write HTML to temp file
                await File.WriteAllTextAsync(htmlFile, htmlContent);

                var process = new Process
                {
                    StartInfo = new ProcessStartInfo
                    {
                        FileName = @"C:\Program Files\wkhtmltopdf\bin\wkhtmltopdf.exe",
                        Arguments = $"--encoding utf-8 --margin-top 10 --margin-bottom 10 --orientation Portrait --page-size A4 \"{htmlFile}\" \"{pdfFile}\"",
                        UseShellExecute = false,
                        CreateNoWindow = true,
                        RedirectStandardOutput = true,
                        RedirectStandardError = true
                    }
                };

                process.Start();

                // Read stdout/stderr asynchronously (helps prevent hang for large output)
                string output = await process.StandardOutput.ReadToEndAsync();
                string error = await process.StandardError.ReadToEndAsync();

                await process.WaitForExitAsync();

                if (process.ExitCode != 0)
                {
                    throw new Exception($"wkhtmltopdf failed with exit code {process.ExitCode}. Error: {error}");
                }

                // Read generated PDF
                byte[] pdfBytes = await File.ReadAllBytesAsync(pdfFile);
                return pdfBytes;
            }
            finally
            {
                // Cleanup temp files safely
                if (File.Exists(htmlFile)) File.Delete(htmlFile);
                if (File.Exists(pdfFile)) File.Delete(pdfFile);
            }
        }
    }
}