namespace Verdocs.Models;

/// <summary>
/// One answer to a KBA challenge question. The js-sdk declares this shape twice (IKBAResponse
/// in Envelopes/Types.ts and IKbaChallengeResponse in Envelopes/KBA.ts); one record serves
/// both.
/// </summary>
public sealed record KbaResponse
{
    /// <summary>The kind of question being answered.</summary>
    public required string Type { get; init; }

    /// <summary>The selected answer. A string or a number in the js-sdk, so it is serialized as its runtime type; pass the option value exactly as presented.</summary>
    public required object Answer { get; init; }
}
