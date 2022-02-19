import React, { useEffect, useState } from 'react'
import styled from 'styled-components'

import {getManifest} from '../../components/apis/beekeeper'

import * as BH from '../../components/apis/beehive'


export default function Stress() {

  const [query, setQuery] = useState<object>()
  const [nodeIds, setNodeIds] = useState([])

  useEffect(() => {
    // get node list
    getManifest()
      .then(async meta => {
        const nodeIds = Object.keys(meta).slice(0,15)
        setNodeIds(nodeIds)

        const [prom, query] = await BH.stressTest(nodeIds[0].toLowerCase())
        setQuery(query)

        // fetch some data
        const proms = Promise.allSettled(
          nodeIds.map(id =>
            BH.stressTest(id.toLowerCase())[0]
          )
        )

        proms.catch(err => {
          console.log('err', err)
        })
      })
  }, [])

  return (
    <Root>
      <h1>A "Stress Test"</h1>

      <p>Number of queries: {nodeIds.length}</p>

      Query sample:
      <pre className="code">
        {JSON.stringify(query, null, 4)}
      </pre>
    </Root>
  )
}


const Root = styled.div`
  margin: 20px;
`

