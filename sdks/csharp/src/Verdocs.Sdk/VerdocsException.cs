namespace Verdocs;

/// <summary>
/// Base type for exceptions raised by the Verdocs SDK. Catch this to handle anything
/// SDK-shaped; catch <see cref="VerdocsApiException"/> to handle API failures specifically.
/// </summary>
public class VerdocsException : Exception
{
    /// <summary>Creates the exception with no message.</summary>
    public VerdocsException()
    {
    }

    /// <summary>Creates the exception with a message.</summary>
    /// <param name="message">Description of the failure.</param>
    public VerdocsException(string message)
        : base(message)
    {
    }

    /// <summary>Creates the exception with a message and an inner cause.</summary>
    /// <param name="message">Description of the failure.</param>
    /// <param name="innerException">The underlying cause.</param>
    public VerdocsException(string message, Exception innerException)
        : base(message, innerException)
    {
    }
}
