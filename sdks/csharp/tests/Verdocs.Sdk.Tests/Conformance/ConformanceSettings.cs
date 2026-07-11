namespace Verdocs.Sdk.Tests.Conformance;

/// <summary>Credentials and target for the live conformance lane. Values are never printed.</summary>
internal sealed record ConformanceSettings(string ApiBase, string Email, string Password);
