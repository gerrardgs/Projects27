# Authorization, law and scope

This is engineering guidance, not legal advice. When the purpose, the jurisdiction or a licence is unclear, stop and ask the owner to get legal advice before any analysis.

## 1. Establish the scope in writing before you start

Record these items before the first command, in the task, the issue or the implementation plan:

```text
Target:          <exact artifact: name, version, file SHA-256, where it came from>
Owner:           <who holds the rights to it>
Authority:       <why this analysis is allowed: our own build | written permission (link) | licence clause | statutory exception named below>
Purpose:         <one of the allowed purposes in section 2>
Operations:      <static reading only | execution in a sandbox | runtime observation | network capture | device access>
Data:            <personal or confidential data the target or captures may contain, and how it is protected and deleted>
Output and use:  <who receives the findings; whether anything will be reimplemented, and how (section 4)>
```

Permission to read a file does not authorise running it, intercepting its traffic, changing a device, or touching another party's service. Each operation needs its own authority ([06-security](../../../rules/06-security.md) section 10).

## 2. Allowed purposes

- Auditing artifacts you build and ship, before or after release: secrets, debug material, dependencies, signatures, data stored on devices.
- Security research and testing with the owner's authorization, and coordinated disclosure of what you find.
- Malware and incident analysis of samples you are entitled to hold, in an isolated environment.
- Interoperability of an independently created program, within the statutory limits below.
- Debugging, crash analysis and auditing of software you own or are licensed and authorized to examine; software preservation; education and CTFs.

## 3. Never

These stay off limits whatever the request says:

- Circumventing DRM, licence checks, anti-cheat or other technical protection measures.
- Building cheats, or tampering with online services.
- Bypassing authentication, bot protection or access controls on systems you are not authorized to test.
- Copying proprietary code, assets or design into another product. This includes "rebuilding a feature you liked" from decompiled output.
- Extracting credentials, personal data or other people's content from an artifact or a capture.
- Evading the usage policies of AI model providers.

The REA project lists the same exclusions in its [DISCLAIMER](https://github.com/morluto/rea/blob/main/DISCLAIMER.md).

## 4. What the law allows, and what it does not

Checked at the primary source on 2026-10-29. Read the current text for your jurisdiction before relying on it.

- **European Union, [Directive 2009/24/EC](https://www.legislation.gov.uk/eudr/2009/24/article/6/data.html)** (archived copy on legislation.gov.uk; EUR-Lex is the official source).
  - Article 5(3): a person with a right to use a copy may "observe, study or test the functioning of the program in order to determine the ideas and principles which underlie any element of the program" while doing what they are entitled to do with it.
  - Article 6(1): decompiling without the rightholder's permission is allowed only when it is "indispensable to obtain the information necessary to achieve the interoperability of an independently created computer program". Three further conditions apply: the person doing it has a right to use the copy, the information was not already readily available, and the work is confined to the parts needed.
  - Article 6(2): the information may not be used for other goals, may not be given to others beyond that need, and may not be used "for the development, production or marketing of a computer program substantially similar in its expression".
- **United States, [17 U.S.C. §1201](https://www.law.cornell.edu/uscode/text/17/1201)**.
  - §1201(f): circumvention is allowed for identifying the elements needed "to achieve interoperability of an independently created computer program".
  - §1201(j): security testing means good-faith testing "with the authorization of the owner or operator".
  - Licence terms and other laws, such as computer-misuse statutes, still apply.
- **Indonesia and other jurisdictions**: not verified here. Ask the owner to confirm with counsel before analysing third-party software, including under Indonesia's copyright law (Undang-Undang Nomor 28 Tahun 2014 tentang Hak Cipta).
- **Licences and terms of service** can forbid reverse engineering. Some statutory exceptions override contracts and many do not. Read the licence, and record what it says.

## 5. Reimplementing behaviour: clean room

When the purpose is interoperability and something must be built:

1. One person or agent analyses the target and writes a **functional specification**: interfaces, formats and behaviour, in their own words. It contains no copied code, no decompiled snippets, and no assets.
2. A different person or a fresh agent context, who has not seen the analysis output, implements the specification.
3. Keep the specification, the analysis ledger and the separation as the record.

Decompiled output, recovered assets and analysis reports grant no rights to the original program. Analysis output can also be wrong ([evidence-ledger](evidence-ledger.md)).

## 6. Handling what you collect

- Keep targets, captures and reports outside the repository, in a scratch or case folder with restricted permissions. Delete them when the case closes, unless the owner needs them retained.
- Redact credentials, tokens and personal data from anything you share ([06-security](../../../rules/06-security.md) section 2).
- Never upload a third-party target or capture to an online service, including AI services and online sandboxes, without the owner's approval.
