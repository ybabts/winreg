# WINREG
A library for the Windows OS registry CLI. Requires Deno run permission for all of the functions. Input is not sanitized so **DO NOT ALLOW USER INPUT**.

## Import
```ts
import * as winreg from 'https://deno.land/x/winreg@v0.1/index.ts'
```

## Query
Queries for a KeyName with options a second parameter contained in an object. The following is a list of the options in that object. It's important to note that the searchX options only work when the searchPattern option is provided. **DO NOT ALLOW USER INPUT**

## Add
Adds a registry entry at the provided KeyName, this doesn't require any kind of prompt it just overwrites whatever is there so **DO NOT ALLOW USER INPUT**.

## Remove
Deletes a registry entry at the provided KeyName, doesn't prompt you for confirmation so be careful. Also **DO NOT ALLOW USER INPUT**.

## Copy
Copies one registry entry at KeyName1 to KeyName2. Does not prompt for confirmation so be careful. **DO NOT ALLOW USER INPUT**.

## Save
Saves a registry entry at KeyName to FileName. Automatically overwrites the file at FileName. I don't think I can make this more clear, **DO NOT ALLOW USER INPUT**.

## Restore
Restores a registry entry from FileName to KeyName. **DO NOT ALLOW USER INPUT**.

## Load
Loads a registry entry from FileName to KeyName. **DO NOT ALLOW USER INPUT**.

## Unload
Unloads the registry entry at KeyName location. **DO NOT ALLOW USER INPUT**.


## Compare
Compares two registry locations at the given locations. **DO NOT ALLOW USER INPUT**
> The symbols at the front of each outputted line are defined as:
>   = means FullKey1 data is equal to FullKey2 data
>   < refers to FullKey1 data and is different than FullKey2 data
>   \> refers to FullKey2 data and is different than Fullkey1 data

###### Usage
```ts
await compare('HKEY_CURRENT_USER\\Software\\Valve', 'HKEY_CURRENT_USER\\Software\\Valve\\Steam');
```

## Unfinished Commands
* Compare
* Export
* Import
* Flags
