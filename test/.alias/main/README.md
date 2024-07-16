# Hello lib

[![mops](http://localhost:4943/badge/mops/hello?canisterId=2d2zu-vaaaa-aaaak-qb6pq-cai)](https://mops.one/hello)
[![documentation](http://localhost:4943/badge/documentation/hello?canisterId=2d2zu-vaaaa-aaaak-qb6pq-cai)](https://mops.one/hello/docs)

`hello` - example lib

### Usage
```motoko
import {hello} "mo:hello";

func greet(): Text {
	hello("World");
};
```