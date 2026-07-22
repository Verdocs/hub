using System.Net;

namespace Verdocs;

/// <summary>
/// Thrown when a Verdocs API call fails: the server returned a non-success status code, or a
/// success response whose body could not be read as the expected type. Carries the HTTP status
/// and the raw response body so callers can inspect exactly what the server said.
/// </summary>
public sealed class VerdocsApiException : VerdocsException
{
    /// <summary>Creates the exception for a failed API response.</summary>
    /// <param name="statusCode">The HTTP status code the server returned.</param>
    /// <param name="responseBody">The raw response body, which may be empty.</param>
    public VerdocsApiException(HttpStatusCode statusCode, string responseBody)
        : this(statusCode, responseBody, $"The Verdocs API returned {(int)statusCode} ({statusCode}).")
    {
    }

    /// <summary>Creates the exception with a custom message.</summary>
    /// <param name="statusCode">The HTTP status code the server returned.</param>
    /// <param name="responseBody">The raw response body, which may be empty.</param>
    /// <param name="message">Description of the failure.</param>
    public VerdocsApiException(HttpStatusCode statusCode, string responseBody, string message)
        : base(message)
    {
        StatusCode = statusCode;
        ResponseBody = responseBody;
    }

    /// <summary>Creates the exception with a custom message and an inner cause.</summary>
    /// <param name="statusCode">The HTTP status code the server returned.</param>
    /// <param name="responseBody">The raw response body, which may be empty.</param>
    /// <param name="message">Description of the failure.</param>
    /// <param name="innerException">The underlying cause, typically a JSON parse failure.</param>
    public VerdocsApiException(HttpStatusCode statusCode, string responseBody, string message, Exception innerException)
        : base(message, innerException)
    {
        StatusCode = statusCode;
        ResponseBody = responseBody;
    }

    /// <summary>The HTTP status code the server returned.</summary>
    public HttpStatusCode StatusCode { get; }

    /// <summary>The raw response body, useful for logging and support cases.</summary>
    public string ResponseBody { get; }
}
