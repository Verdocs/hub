#!/usr/bin/env bash
# Rebuild Verdocs.Sdk XML docs, refresh DocFX metadata, then emit sdk-docs.json.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

dotnet build src/Verdocs.Sdk/Verdocs.Sdk.csproj -c Debug --nologo -v q

dotnet tool restore

run_docfx() {
  if dotnet tool run docfx -- "$@"; then
    return 0
  fi

  # dotnet tool run can fail when the resolver cache points at a missing package
  # (e.g. after NUGET_PACKAGES changes). Fall back to the restored NuGet package.
  local packages="${NUGET_PACKAGES:-$HOME/.nuget/packages}"
  local version
  version="$(dotnet tool list | awk '/^docfx / { print $2; exit }')"
  local dll
  for tfm in net9.0 net8.0; do
    dll="$packages/docfx/$version/tools/$tfm/any/docfx.dll"
    if [[ -f "$dll" ]]; then
      dotnet "$dll" "$@"
      return 0
    fi
  done

  echo "error: docfx not available after dotnet tool restore" >&2
  return 1
}

# DocFX metadata is the documented extraction path; the normalizer reads the XML
# documentation file DocFX itself consumes (where <sdkOperation> tags live).
run_docfx metadata docs/docfx.json --logLevel Warning

dotnet run --project docs/GenerateSdkDocs/GenerateSdkDocs.csproj -c Release --nologo -v q
