using System;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Linq.Expressions;
using Accounting.Models;
using Microsoft.EntityFrameworkCore;

public class UniqueNameAttribute : ValidationAttribute
{
  protected override ValidationResult IsValid(object value, ValidationContext validationContext)
  {
    // Get the DbContext from the validation context
    var dbContext = (webappContext)validationContext.GetService(typeof(webappContext));
    if (dbContext == null)
    {
      throw new InvalidOperationException("DbContext is not available.");
    }

    // Get the entity type being validated
    var entityType = validationContext.ObjectInstance.GetType();

    // Get the property name being validated (e.g., "Name")
    var propertyName = validationContext.MemberName;
    if (string.IsNullOrEmpty(propertyName))
    {
      throw new InvalidOperationException("Property name is not specified.");
    }

    // Get the value of the property being validated
    var name = value as string;
    if (name == null)
    {
      return ValidationResult.Success; // If the value is null, consider it valid
    }

    // Get the primary key property (e.g., "Id")
    var primaryKeyProperty = entityType.GetProperty("Id");
    if (primaryKeyProperty == null)
    {
      throw new InvalidOperationException("Primary key property 'Id' not found.");
    }

    // Get the primary key value of the entity being validated
    var primaryKeyValue = primaryKeyProperty.GetValue(validationContext.ObjectInstance);

    // Use reflection to call the generic Set<TEntity>() method
    var setMethod = typeof(webappContext).GetMethod("Set", Type.EmptyTypes);
    if (setMethod == null)
    {
      throw new InvalidOperationException("Set method not found in DbContext.");
    }

    var genericSetMethod = setMethod.MakeGenericMethod(entityType);
    var dbSet = genericSetMethod.Invoke(dbContext, null);

    // Use reflection to create a query for the DbSet
    var anyMethod = typeof(Enumerable).GetMethods()
        .FirstOrDefault(m => m.Name == "Any" && m.GetParameters().Length == 2);
    if (anyMethod == null)
    {
      throw new InvalidOperationException("Any method not found in Enumerable.");
    }

    var genericAnyMethod = anyMethod.MakeGenericMethod(entityType);

    // Create a lambda expression to check for duplicates
    var parameter = Expression.Parameter(entityType, "e");
    var property = Expression.Property(parameter, propertyName);
    var valueExpression = Expression.Constant(name);
    var equality = Expression.Equal(property, valueExpression);

    // Exclude the current entity if it's being edited
    if (primaryKeyValue != null)
    {
      var primaryKeyExpression = Expression.Property(parameter, primaryKeyProperty);
      var primaryKeyValueExpression = Expression.Constant(primaryKeyValue);
      var notEqual = Expression.NotEqual(primaryKeyExpression, primaryKeyValueExpression);
      equality = Expression.AndAlso(equality, notEqual);
    }

    var lambda = Expression.Lambda(equality, parameter);

    // Execute the query
    var isDuplicate = (bool)genericAnyMethod.Invoke(null, new[] { dbSet, lambda.Compile() });

    if (isDuplicate)
    {
      return new ValidationResult($"{propertyName} must be unique.");
    }

    return ValidationResult.Success;
  }
}
