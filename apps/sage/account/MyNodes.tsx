import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { useProgress } from '/components/progress/ProgressProvider'

import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded'

import Table from '/components/table/Table'
import * as User from '/components/apis/user'
import * as BK from '/components/apis/beekeeper'
import ErrorMsg from '../ErrorMsg'


const columns = [{
  id: 'vsn',
  label: 'VSN',
  format: (vsn, obj) => <Link to={`/node/${obj.node_id}`}>{vsn}</Link>
}, {
  id: 'schedule',
  label: 'Can schedule?',
  format: (yes) => yes ? <CheckCircleRounded className="success" />  : 'no'

}, {
  id: 'develop',
  label: 'Shell access?',
  format: (yes) => yes ? <CheckCircleRounded className="success" /> : 'no'
}]


export default function MyNodes() {
  const {setLoading} = useProgress()

  const [data, setData] = useState<User.MyNode[]>()
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)

    Promise.all([User.listMyNodes(), BK.getManifest({by: 'vsn'})])
      .then(([nodes, manifests]) => setData(nodes.map(o => ({...o, ...manifests[o.vsn]}))))
      .catch(error => setError(error))
      .finally(() => setLoading(false))

  }, [setLoading])

  return (
    <Root>
      <h1 className="no-margin">My privileges on shared nodes</h1>
      <br/>
      {data &&
        <Table
          primaryKey="vsn"
          enableSorting
          columns={columns}
          rows={data}
        />
      }

      {error &&
        <ErrorMsg>{error.message}</ErrorMsg>
      }
    </Root>
  )
}

const Root = styled.div`

`