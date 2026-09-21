"""Extract Python SDK docs into the shared sdk-docs.json model.

Uses griffe (the same AST mkdocstrings builds on) to load tagged resource
classes and emit a single-language model matching packages/js-sdk/sdk-docs.json.
Only sync classes are walked so @sdkOperation ids are not claimed twice by
their async counterparts.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any

import griffe

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
OUTPUT = ROOT / "sdk-docs.json"
PACKAGE = "verdocs"
# Sync resource classes with @sdkOperation tags. Add modules here as they land.
_RESOURCE_CLASSES: list[tuple[str, str]] = [
    ("verdocs.resources.api_keys", "ApiKeys"),
    ("verdocs.resources.auth", "Auth"),
    ("verdocs.resources.brands", "Brands"),
    ("verdocs.resources.contacts", "Contacts"),
    ("verdocs.resources.envelopes", "Envelopes"),
    ("verdocs.resources.groups", "Groups"),
    ("verdocs.resources.initials", "Initials"),
    ("verdocs.resources.invitations", "Invitations"),
    ("verdocs.resources.kba", "KBA"),
    ("verdocs.resources.members", "Members"),
    ("verdocs.resources.mfa", "MFA"),
    ("verdocs.resources.notification_templates", "NotificationTemplates"),
    ("verdocs.resources.organizations", "Organizations"),
    ("verdocs.resources.profiles", "Profiles"),
    ("verdocs.resources.recipients", "Recipients"),
    ("verdocs.resources.sessions", "Sessions"),
    ("verdocs.resources.signatures", "Signatures"),
    ("verdocs.resources.template_documents", "TemplateDocuments"),
    ("verdocs.resources.template_fields", "TemplateFields"),
    ("verdocs.resources.template_roles", "TemplateRoles"),
    ("verdocs.resources.templates", "Templates"),
    ("verdocs.resources.users", "Users"),
    ("verdocs.resources.webhooks", "Webhooks"),
]

# Modules whose top-level functions may carry @sdkOperation tags (Helpers page).
_HELPER_MODULES: list[str] = [
    "verdocs.permissions",
    "verdocs.validators",
    "verdocs.utils.token",
    "verdocs.utils.strings",
    "verdocs.utils.primitives",
    "verdocs.utils.entitlements",
    "verdocs.utils.dates",
    "verdocs.utils.files",
    "verdocs.utils.auth",
]

_SDK_TAG_RE = re.compile(
    r"^@(sdkOperation|sdkGroup|sdkPage|sdkGettingStarted)(?:\s+(.+))?$",
    re.MULTILINE,
)

_SDK_PAGES = {"Endpoints", "Helpers"}


def _slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.strip().lower())
    return slug.strip("-")


def _annotation_to_string(annotation: Any) -> str:
    if annotation is None:
        return "None"
    return str(annotation)


def _first_paragraph(text: str) -> str:
    parts = [part.strip() for part in text.strip().split("\n\n") if part.strip()]
    return parts[0] if parts else ""


def _parse_sdk_tags(docstring_value: str) -> dict[str, Any]:
    tags: dict[str, Any] = {
        "sdkOperation": "",
        "sdkGroup": "",
        "sdkPage": "",
        "gettingStarted": False,
    }
    for match in _SDK_TAG_RE.finditer(docstring_value):
        name = match.group(1)
        value = (match.group(2) or "").strip()
        if name == "sdkGettingStarted":
            tags["gettingStarted"] = True
        elif name == "sdkOperation":
            tags["sdkOperation"] = value
        elif name == "sdkGroup":
            tags["sdkGroup"] = value
        elif name == "sdkPage":
            tags["sdkPage"] = value
    return tags


def _strip_sdk_tags(text: str) -> str:
    return _SDK_TAG_RE.sub("", text).strip()


def _extract_from_docstring(docstring: griffe.Docstring | None) -> dict[str, Any]:
    summary = ""
    params_docs: dict[str, str] = {}
    returns_description = ""
    throws: list[dict[str, str]] = []
    examples: list[dict[str, str]] = []
    tags = (
        _parse_sdk_tags(docstring.value)
        if docstring
        else {
            "sdkOperation": "",
            "sdkGroup": "",
            "sdkPage": "",
            "gettingStarted": False,
        }
    )

    if not docstring:
        return {
            "summary": summary,
            "params_docs": params_docs,
            "returns_description": returns_description,
            "throws": throws,
            "examples": examples,
            "tags": tags,
        }

    for section in docstring.parse("google"):
        kind = getattr(section.kind, "value", section.kind)
        if kind == "text":
            cleaned = _strip_sdk_tags(str(section.value))
            if cleaned and not summary:
                summary = _first_paragraph(cleaned)
        elif kind == "admonition" and getattr(section.value, "kind", None) == "example":
            code = str(section.value.contents).strip()
            if code:
                examples.append({"language": "python", "code": code})
        elif kind == "parameters":
            for item in section.value:
                params_docs[item.name] = item.description or ""
        elif kind == "returns":
            for item in section.value:
                if item.description:
                    returns_description = item.description
                    break
        elif kind == "raises":
            for item in section.value:
                throws.append(
                    {
                        "type": _annotation_to_string(item.annotation),
                        "description": item.description or "",
                    }
                )

    return {
        "summary": summary,
        "params_docs": params_docs,
        "returns_description": returns_description,
        "throws": throws,
        "examples": examples,
        "tags": tags,
    }


def _build_signature(name: str, params: list[dict[str, Any]], return_type: str) -> str:
    rendered = []
    for param in params:
        optional_marker = "?" if param["optional"] and param["default"] is None else ""
        default_suffix = "" if param["default"] is None else f" = {param['default']}"
        rendered.append(f"{param['name']}{optional_marker}: {param['type']}{default_suffix}")
    return f"{name}({', '.join(rendered)}) -> {return_type}"


def _method_to_symbol(method: griffe.Function) -> dict[str, Any] | None:
    extracted = _extract_from_docstring(method.docstring)
    tags = extracted["tags"]
    if not tags["sdkOperation"]:
        return None

    group_name = tags["sdkGroup"] or "Ungrouped"
    page = tags["sdkPage"] if tags["sdkPage"] in _SDK_PAGES else "Endpoints"

    params: list[dict[str, Any]] = []
    for param in method.parameters:
        if param.name == "self":
            continue
        has_default = param.default is not None
        params.append(
            {
                "name": param.name,
                "type": _annotation_to_string(param.annotation),
                "description": extracted["params_docs"].get(param.name, ""),
                "optional": has_default,
                "default": str(param.default) if has_default else None,
            }
        )

    return_type = _annotation_to_string(method.returns)
    symbol = {
        "sdkOperation": tags["sdkOperation"],
        "kind": "function",
        "name": method.name,
        "page": page,
        "gettingStarted": tags["gettingStarted"],
        "resource": "function",
        "signature": _build_signature(method.name, params, return_type),
        "summary": extracted["summary"],
        "params": params,
        "returns": {"type": return_type, "description": extracted["returns_description"]},
        "throws": extracted["throws"],
        "examples": extracted["examples"],
        "deprecated": False,
    }
    return {"group_name": group_name, "symbol": symbol}


def _package_version() -> str:
    try:
        from verdocs import __version__

        return __version__
    except Exception:
        return "1.0.0"


def _collect_class_symbols(klass: griffe.Class, groups: dict[str, Any]) -> None:
    for name, member in klass.members.items():
        if name.startswith("_") or not isinstance(member, griffe.Function):
            continue
        mapped = _method_to_symbol(member)
        if mapped is None:
            print(f"skip {klass.name}.{name}: missing @sdkOperation", file=sys.stderr)
            continue

        group_name = mapped["group_name"]
        group_id = _slugify(group_name)
        symbol = mapped["symbol"]
        operation_id = symbol["sdkOperation"]

        group = groups.setdefault(
            group_id,
            {"id": group_id, "name": group_name, "summary": "", "symbols": {}},
        )
        if operation_id in group["symbols"]:
            print(f'warning: duplicate @sdkOperation "{operation_id}"', file=sys.stderr)
        group["symbols"][operation_id] = symbol


def _collect_module_symbols(module: griffe.Module, groups: dict[str, Any]) -> None:
    for name, member in module.members.items():
        if name.startswith("_") or not isinstance(member, griffe.Function):
            continue
        mapped = _method_to_symbol(member)
        if mapped is None:
            print(f"skip {module.name}.{name}: missing @sdkOperation", file=sys.stderr)
            continue

        group_name = mapped["group_name"]
        group_id = _slugify(group_name)
        symbol = mapped["symbol"]
        operation_id = symbol["sdkOperation"]

        group = groups.setdefault(
            group_id,
            {"id": group_id, "name": group_name, "summary": "", "symbols": {}},
        )
        if operation_id in group["symbols"]:
            print(f'warning: duplicate @sdkOperation "{operation_id}"', file=sys.stderr)
        group["symbols"][operation_id] = symbol


def generate() -> dict[str, Any]:
    preamble: dict[str, Any] = {
        "language": "python",
        "package": PACKAGE,
        "version": _package_version(),
        "groups": {},
    }

    for module_path, class_name in _RESOURCE_CLASSES:
        module = griffe.load(
            module_path,
            search_paths=[str(SRC)],
            docstring_parser="google",
        )
        _collect_class_symbols(module[class_name], preamble["groups"])

    for module_path in _HELPER_MODULES:
        module = griffe.load(
            module_path,
            search_paths=[str(SRC)],
            docstring_parser="google",
        )
        _collect_module_symbols(module, preamble["groups"])

    return preamble


def main() -> None:
    model = generate()
    OUTPUT.write_text(json.dumps(model, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {OUTPUT.relative_to(ROOT)} with {sum(len(g['symbols']) for g in model['groups'].values())} symbols")


if __name__ == "__main__":
    main()
