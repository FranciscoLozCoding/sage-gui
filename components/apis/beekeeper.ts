import config from '../../config'
const url = config.beekeeper

import { handleErrors } from '../fetch-utils'

import { NodeStatus } from '../../admin-ui/node'
import { OpenInBrowser } from '@mui/icons-material'


const API_URL = `${url}/api`


export type State = {
  address: string
  altitude: number
  beehive: string
  id: string
  internet_connection: string
  mode: string
  name: string
  project_id: null
  registration_event: string // todo: fix format
  server_node: string
  timestamp: string   // todo: fix format ("Sun, 14 Mar 2021 16:58:57 GMT")

  /* new, proposed fields? */
  vsn: string
  gps_lat: string     // todo: should be number
  gps_lon: string     // todo: should be number
  node_type?: string
  project?: string
  location?: string
  status?: NodeStatus  // may be replaced with 'mode' or such?
}

 export type OntologyObj = {
  description: string
  ontology: string // xxy.yyy.zzz
  source: string   // url
  unit: string
}


function get(endpoint: string, opts={}) {
  return fetch(endpoint, opts)
    .then(handleErrors)
    .then(res => res.json())
}



async function getMonitorData() {
  const data = await get(`${url}/monitoring`)

  return data
    .reduce((acc, {node_id, expected_online}) =>
      ({...acc, [node_id]: {expected_online}})
    , {})
}



type MetaParams = {node?: string, by?: 'vsn' | 'id'}

export async function getManifest(params?: MetaParams) {
  let {node, by = 'id'} = params || {}

  let data = await get(`${url}/production`)

  // special handling of gps since it is string type; todo(nc): remove
  data = data.map(o => ({
    ...o,
    gps_lat: o.gps_lat?.length ? parseFloat(o.gps_lat) : null,
    gps_lon: o.gps_lon?.length ? parseFloat(o.gps_lon) : null,
  }))

  let mapping
  if (by == 'id') {
    mapping = data.reduce((acc, node) => ({...acc, [node['node_id']]: node}), {})
  } else if (by == 'vsn') {
    mapping = data.reduce((acc, node) => ({...acc, [node.vsn]: node}), {})
  }

  if (!node) {
    return mapping
  } else if (node.length == 16 || (node.length == 4 && by == 'vsn')) {
    if (node in mapping) {
      return getFactory({node})
        .then(factory => ({...mapping[node], factory}))
    }
    return null
  } else {
    throw 'getManifest: must provide `by=vsn` option if filtering to a node by VSN'
  }
}


export async function getFactory(params?: MetaParams) {
  const {node, by = 'id'} = params

  const data = await get(`${url}/factory`)

  let mapping
  if (by == 'id') {
    mapping = data.reduce((acc, node) => ({...acc, [node['node_id']]: node}), {})
  } else if (by == 'vsn') {
    mapping = data.reduce((acc, node) => ({...acc, [node.vsn]: node}), {})
  }

  return node ?
    data.filter(o => node.length == 4 ? o.vsn == node : o.node_id == node)[0] : mapping
}


function _joinNodeData(nodes, nodeMetas, monitorMeta) {
  return nodes.map(obj => {
    const {id} = obj

    const meta = nodeMetas[id]
    const monIsAvail = monitorMeta && id in monitorMeta

    const { expected_online = null } = monIsAvail ? monitorMeta[id] : {}

    return {
      ...obj,
      ...meta,
      expected_online: !!expected_online,
      status: expected_online ? 'reporting' : 'offline',
      registration_event: new Date(obj.registration_event).getTime()
    }
  })
}



export async function getState() : Promise<State[]> {
  const proms = [getNodes(), getManifest(), getMonitorData()]
  let [nodes, meta, monitorMeta] = await Promise.all(proms)

  let allMeta = _joinNodeData(nodes, meta, monitorMeta)

  // whether or not to ignore things like 000000000001, laptop registration, test nodes, etc
  const shouldSanitizeNodes = monitorMeta && config.admin.filterNodes
  if (shouldSanitizeNodes) {
    const includeList = Object.keys(monitorMeta)
    allMeta = allMeta.filter(obj => includeList.includes(obj.id))
  }

  // Add in dell nodes (until they are in beekeeper);
  // todo(nc): remove once registered!!
  allMeta = [
    ...allMeta,
    ...Object.values(meta)
      .filter(o => o.node_type == 'Dell' && o.node_id.length == 16)
      .map(o => ({
        ...o,
        id: o.node_id,
        hasStaticGPS: !!o.gps_lat && !!o.gps_lon,
        status: 'dell node',
        lat: o.gps_lat,
        lng: o.gps_lon
      }))
  ].filter((o, i, self) =>
    i == self.findIndex(o2 => o2.id == o.id)
  )


  return allMeta
}



export async function getSuryaState() : Promise<State[]> {
  const proms = [getNodes(), getManifest(), getMonitorData(), getFactory({by: 'id'})]
  const [nodes, meta, monitorMeta, factory] = await Promise.all(proms)

  const allButFactory = _joinNodeData(nodes, meta, monitorMeta)
  const allSuryaData = allButFactory.map(o => ({...o, factory: factory[o.id]}) )
  return allSuryaData
}



export async function getNodes() {
  const data = await get(`${API_URL}/state`)
  return data.data
}



export async function getNode(id: string) : Promise<State[]> {
  const data = await get(`${API_URL}/state/${id}`)
  return data.data
}



export async function getOntologyList() : Promise<OntologyObj[]> {
  const data = await get(`${url}/ontology`)
  return data
}

export async function getOntology(name: string) : Promise<OntologyObj> {
  const data = await getOntologyList()
  return data.find(o => o.ontology == name) as OntologyObj
}

