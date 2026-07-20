#!/usr/bin/env bash
# Rebuild Verdocs.Sdk XML docs, refresh DocFX metadata, then emit sdk-docs.json.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

dotnet build src/Verdocs.Sdk/Verdocs.Sdk.csproj -c Debug --nologo -v q

dotnet tool restore >/dev/null
# DocFX metadata is the documented extraction path; the normalizer reads the XML
# documentation file DocFX itself consumes (where <sdkOperation> tags live).
dotnet tool run docfx -- metadata docs/docfx.json --logLevel Warning

dotnet run --project docs/GenerateSdkDocs/GenerateSdkDocs.csproj -c Release --nologo -v q
