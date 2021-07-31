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

### Entry Generation

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
    "statusEntryId": "b3xce8b904295b3e226c4127718f3b15aa3280261f223df2e718d9a04dea7ab4",
    "statusTrieUrl": "did:ion:123?service=IdentityHub/Query?id=a2038cddfbb8e..."
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
        entry.ancestor = branch;
        branch[char] ? delete branch[char].close : branch[char] = { close: char };
        entry.branch = branch[char];
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
  { key: 'abx', value: 0 },
  { key: 'acd', value: 2 },
  { key: 'ace', value: 1 },
  { key: 'fgh', value: 1 },
  { key: 'fgi', value: 0 }
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

Upon receiving a status list response from the Issuer, use the following process to check the status of a target entry:
  1. 
  
#### Implementation Example

::: example
```javascript
function getStatusFromTrie(key, trie){
  let branch = trie;
  for (let char of key) {
    let value = branch[char];
    let type = typeof value;
    if (type === 'object') branch = value;
    else return value;
  }
}

```
:::

Continuing with the example from the [Status Trie Assembly](#status-trie-assembly) section, if a status lookup for the entry `abx...` was attempted against the example trie it would return the value `0`. If a status lookup for a nonexistent entry `xyz...` was attempted, it would return the value `undefined`:

::: example
```javascript
const abxStatus = getStatusFromTrie('abx', exampleTrie)
// returns 2
const xyzStatus = getStatusFromTrie('xyz', exampleTrie)
// returns undefined
```
:::