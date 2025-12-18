using System.ComponentModel.DataAnnotations;

namespace Accounting.Models.Validation
{
    // Ensures at least one of Debit or Credit is entered (>0)
    [AttributeUsage(AttributeTargets.Class, AllowMultiple = false)]
    public class RequireOneOfDebitOrCreditAttribute : ValidationAttribute
    {
        protected override ValidationResult IsValid(object? value, ValidationContext validationContext)
        {
            if (validationContext.ObjectInstance == null)
                return ValidationResult.Success!;

            var model = (AccountOpeningDValidation)validationContext.ObjectInstance;

            bool hasDebit = model.Debit.HasValue && model.Debit > 0;
            bool hasCredit = model.Credit.HasValue && model.Credit > 0;

            if (!hasDebit && !hasCredit)
            {
                return new ValidationResult(
                    ErrorMessage ?? "Either Debit or Credit is required.",
                    new[] { nameof(model.Debit), nameof(model.Credit) }
                );
            }

            return ValidationResult.Success!;
        }
    }
}
