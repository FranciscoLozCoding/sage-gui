export function prettyUptime(secs: number) {
  if (!secs && secs != 0) return
  return new Date(secs * 1000).toISOString().substr(11, 8)
}


export function bytesToSizeIEC(bytes: number) {
  if (!bytes && bytes != 0) return
  const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB']
  if (bytes == 0) return '0 Byte'
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i]
}


export function bytesToSizeSI(bytes) {
  if (!bytes && bytes != 0) return
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  if (bytes == 0) return '0 Byte'
  const i = Math.floor(Math.log(bytes) / Math.log(1000))
  return (bytes / Math.pow(1000, i)).toFixed(2) + ' ' + sizes[i]
}


// https://stackoverflow.com/a/32180863
export function msToTime(ms: number) {
  if (!ms && ms != 0) return
  let secs = Number( (ms / 1000).toFixed(1))
  let mins = Number( (ms / (1000 * 60)).toFixed(1) )
  let hours = Number( (ms / (1000 * 60 * 60)).toFixed(1) )
  let days = Number( (ms / (1000 * 60 * 60 * 24)).toFixed(1) )
  if (secs < 60) return `${secs} sec${secs != 1 ? 's' : ''}  ago`
  else if (mins < 60) return mins + ' min ago'
  else if (hours < 24) return hours + ' hrs ago'
  else return days + ' says ago'
}
