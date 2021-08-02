Status Trie 2021
==================

Privacy-preserving status publication via truncated, collision-filtered identifiers distributed over a trie structure.

**Specification Status:** Strawman

**Latest Draft:**
  [https://csuwildcat.github.io/status-trie](https://csuwildcat.github.io/status-trie)

Editors:
~ [Daniel Buchner](https://www.linkedin.com/in/dbuchner/)

Participate:
~ [GitHub repo](https://github.com/csuwildcat/status-trie)
~ [File a bug](https://github.com/csuwildcat/status-trie/issues)
~ [Commit history](https://github.com/csuwildcat/status-trie/commits/master)

------------------------------------

## Abstract

A critical component of any system of privacy-sensitive proofs (e.g. credentials) that may require third-parties to check status (i.e. revocation, suspension) is the ability to do so in a way the preserves the privacy of the Subject of the proof during the status check process.

## Overview

Like other schemes, this mechanism enables status flags to be expressed for a large, aggregated set of status entries via presence of a truncated cryptographically random unique identifier and status indicator flags. However, unlike schemes that require each entry to be assigned a static index position in a bit field, this construction removes those strictures and enables dynamic and flexible construction of status entries, while at the same time allowing for communication of multiple status states.

## Scheme

The following are the relevant phases of the scheme, broken out into the major steps involved in generating entries, requesting status for entries, and processing/validation of the trie by Verifiers:

### Status Entry Generation

The following process is used for generating an entry in the trie that corresponds to a credential status indication:

1. At time of status-relevant object generation (e.g. verifiable credentials), a cryptographically random unique identifier should be generated and distributed with and bound to the status-relevant object.
2. The mapping of the cryptographically random unique identifier generated in Step 1 must be retained by the status publication entity (e.g. credential Issuer) for inclusion in the status trie when its status warrants doing so.

::: example Sample entry with unique status value
```json
{
  "@context": [ ... ],
  "id": "https://example.com/credentials/1234567890",
  "type": ["VerifiableCredential"],
  "issuer": "did:example:123",
  "issued": "2020-04-05T14:27:42Z",
  "credentialStatus": {
    "id": "https://dmv.example.gov/credentials/status/0918273645",
    "type": "StatusTrie2021",
    "statusEntryId": "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c=",
    "statusTrieUrl": "did:ion:123?service=IdentityHub&relativeRef=/Query?id=a2038cddfbb8e..."
  },
  "credentialSubject": { ... },
  "proof": { ... }
}
```
:::

The object encoding the Status Trie information should be encoded with the following properties:

- `id` - *string*: an identifier string for the containing object (required in certain formats/contexts - e.g. Verifiable Credential `credentialStatus` objects)
- `type` - *string*: a string indicating that the type of information within is about a Status Trie 2021 
- `statusEntryId` - *Base64Url string*: a cryptographically random unique identifier string that is used by the status publication entity to express a status for the entry in the trie.
- `statusTrieUrl` - *URL string*:  the URL at which the status trie resource can be found.

### Status Trie Assembly

The subtrees of the trie should extend no deeper than the minimum number of leading `statusEntryId` characters for each entry required to distribute all entries, terminating at the leaf level with the status of the entries used as the integer value.

To generate a status trie JSON representation, use the following process:

1. Let the containing trie be represented as a JSON object.
2. Let there be an *Iteration Counter*, set to 0.
3. Iterate over each entry to be included in the Status Trie, performing the following steps:
    1. Create a *Current Tree* reference for the entry, with a value set to either the *Previous Tree* from the previous iteration loop or the root of the trie.
    2. If the *Current Tree* object indicates the object should be closed to further node distribution, replace the property that holds the *Current Tree* object (e.g. via previous ancestor reference) with the desired status value and remove the entry from the list. If the *Current Tree* object indicates the object should remain open for distribution of further nodes, skip this step. 
    3. Create a *Current Character* reference that is the string value of the character at the index position of the entry ID corresponding with the *Iteration Counter's* current value. If there is no character at the position in the entry's ID that corresponds with the *Iteration Counter's* current value, do not process any further steps for this entry.
    4. Retain a *Previous Tree* reference for this entry with a value set to the *Current Tree* object.
    5. If a property exists in the *Current Tree* object for the character at the index position of the entry ID corresponding with the *Iteration Counter's* current value, remove the reference indicating the property's object is open for distribution of further nodes. If no property exists in the *Current Tree* object for the character at the index position of the entry ID corresponding with the *Iteration Counter's* current value, create a property for the *Current Character* with an object as its value, retain a reference indicating the object is open for distribution of other nodes, and assign the newly created object as the value of the entry's *Current Tree*.
    6. Remove the entry from the list.
4. If any items remain in the list, increment the counter and loop the list again using the process in Step 3.

#### Implementation Example

::: example
```javascript
function assembleTrie(entries){
  let trie = {};
  let iteration = 0;
  while (entries.length) {
    entries = entries.filter(entry => {
      let branch = entry.branch || trie;
      if (branch.close) {
        entry.ancestor[branch.close] = entry.value;
      }
      let char = entry.key[iteration];
      if (char) {
        branch[char] ? delete branch[char].close : branch[char] = { close: char };
        entry.branch = branch[char];
        entry.ancestor = branch;
        return true;
      }
    });
    ++iteration;
  }
  return trie;
}
```
:::


The following contrived status entry IDs:

- `abx...` - with status 0
- `acd...` - with status 2
- `ace...` - with status 1
- `fgh...` - with status 1
- `fgi...` - with status 0

Would be truncated to the minium leading length required for non-colliding distribution across the following trie structure:

::: example

```javascript
let testEntries = [
  { key: 'abx0cc05da728dd30c59bec09a919b11b7ce8de10a5bb571f82c3bd3abfa49e3', value: 0 },
  { key: 'acde7532c5d699ad6619c41bf76cbe571cab54b343842aa9e89464319289016d', value: 2 },
  { key: 'acecfd46dd5be0b3dc92790231a162b9634efc36da7579583010c9cd061b692c', value: 1 },
  { key: 'fghc13cea8b85180577bf52fe55adb9042c836b1e63eca1e6f2eee9b63e506fd', value: 1 },
  { key: 'fgic6ec856d9e715c498693d0509ef33d39435795b7cce74f9182b9012d66df3', value: 0 }
}

const exampleTrie = assembleTrie(testEntries);

// resulting value of exampleTrie:
{
  "a": {
    "b": 0,
    "c": {
      "d": 2,
      "e": 1
    }
  },
  "f": {
    "g": {
      "h": 1,
      "i": 0
    }
  }
}
```
:::

### Relying Party Validation

Upon receiving retrieval of a Status Trie from a `statusTrieUrl`, use the following process to check the status of a target entry:

1. Create a *Current Tree* variable with the initial value set to the Status Trie root.
2. Begin iterating the characters of the `statusEntryId` for entry being checked, and for each character performing the following steps:
  1. Lookup the character in the *Current Tree* and retain a reference to the value.
  2. Determine the value's type, and retain a reference to the type. 
  3. If the type is an `object`, set the *Current Tree* to the value and skip Step 4, allowing the loop to proceed to the next character.
  4. If the type is anything other than `object`, return the value, breaking out of the loop.
3. Let the status be the value from the looping evaluation returned from Step 2. The status value MUST be either `undefined` or one of the status codes in the [Status Codes](#status-codes) section of this document, else the implementation should produce an error.

::: note
If a custom status code is desired, the implementer MUST prefix the status value with a Hyphen-Minus `-`. For reference, the Hyphen-Minus UTF-8 encoding is `0x2D` and the HTML entity representation is `&#45;`
:::

#### Implementation Example

::: example
```javascript
function getStatusFromTrie(key, trie){
  let branch = trie;
  for (let char of key) {
    let value = branch[char];
    if (typeof value === 'object') branch = value;
    else return value;
  }
}
```
:::

Continuing with the example from the [Status Trie Assembly](#status-trie-assembly) section, if a status lookup for the entry `abx...` was attempted against the example trie it would return the value `0`. If a status lookup for a nonexistent entry `xyz...` was attempted, it would return the value `undefined`:

::: example
```javascript
const abxStatus = getStatusFromTrie('abx0cc05da728dd30c59bec09a919b11b7ce8de10a5bb571f82c3bd3abfa49e3', exampleTrie)
// returns 0
const xyzStatus = getStatusFromTrie('xyz5795b7d30c59bec0715c49de10a5bb578693d0509ef33d39435795b7cce74', exampleTrie)
// returns undefined
```
:::

## Status Codes


Code       | Status      | Description
:--------: | :---------- | ------------
`undefined`| NONE     | Indicates there is no additional status information to communicate about the entry. |
0          | Revoked     | Indicates an entry representing an attested set of claims or entitlements (e.g. Verifiable Credentials) has been revoked by the status publishing entity (e.g. Issuer). |
1          | Suspended   | Indicates an entry representing an attested set of claims or entitlements (e.g. Verifiable Credentials) has been suspended by the status publishing entity (e.g. Issuer). |
