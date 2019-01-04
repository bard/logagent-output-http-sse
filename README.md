An HTTP server-side events plugin for [logagent](https://github.com/sematext/logagent-js). Can be used for e.g. writing a custom web log live tail UI.

## Installation

On the machine where you're running logagent:

```
npm install -g logagent-output-http-sse
```

## Configuration

In logagent's `config.yml` output section, add:

```
output:
  http-sse:
    module: logagent-output-http-sse
    port: 80
```

Adjust port as needed. If omitted, it will listen on 3000.

## Usage

Assuming logagent is running on `log.example.com`, the following will stream all log events to the browser console:

```
<html>
  <body>
    <script>
     const eventSource = new EventSource('http://log.example.com/events')

     eventSource.onmessage = (event) => {
       console.log(event.data)
     }
    </script>
  </body>
</html>
```

To request events from certain sources only, use a "source" query parameter with an  [extglob](https://www.npmjs.com/package/extglob) pattern value.

For example, to only request events from sources beginning with "myapp_":

```
     const eventSource = new EventSource('http://log.example.com/events?source=myapp_*')
```

## Security

There is no authorization or encryption, please use a reverse proxy to provide those if running on an untrusted network.
