/* eslint-disable react/display-name */
import React, { useEffect, useState } from 'react'
import { useLocation, useHistory } from 'react-router-dom'
import { Link } from 'react-router-dom'
import styled from 'styled-components'

// import FormControlLabel from '@material-ui/core/FormControlLabel'
// import Checkbox from '@material-ui/core/Checkbox'
import IconButton from '@material-ui/core/IconButton'
import ViewComfyIcom from '@material-ui/icons/ViewComfy'
import SpaciousIcon from '@material-ui/icons/ViewStream'
import Tooltip from '@material-ui/core/Tooltip'
import ErrorMsg from '../ErrorMsg'
import { useSnackbar } from 'notistack'

import Table from '../../components/table/Table'
import TableSearch from '../../components/table/TableSearch'

import SpaciousLayout from './SpaciousLayout'

import BeeIcon from 'url:../../assets/bee.svg'

import * as ECR from '../apis/ecr'


type VerTooltipProps = {
  versions: {version: string}[]
}

export function VersionTooltip(props: VerTooltipProps) {
  const {versions} = props

  return (
    <Tooltip
      arrow
      title={
        <>
          <div>Versions:</div>
          {versions.map(o => <div key={o.version}>{o.version}</div>)}
        </>
      }
    >
      <a>{versions.length} version{versions.length > 1 ? 's' : ''}</a>
    </Tooltip>
  )
}


const columns = [
  {
    id: 'name',
    label: 'Name',
    format: (name, o) =>
      <Link to={`app/${o.namespace}/${name}/${o.version}`}>{name}</Link>
  }, {
    id: 'namespace',
    label: 'Namespace'
  }, {
    id: 'versions',
    label: 'Version',
    format: (versions) => {
      if (!versions?.length) return '-'

      return (
        <>
          {versions[versions?.length - 1].version}{' '}
          (<VersionTooltip versions={versions}/>)
        </>
      )
    }
  }, {
    id: 'owner_id',
    label: 'Owner'
  }, {/*
    id: 'permissions',
    label: 'Members',
    format: (perms) => {
      return perms.length == 1 ? `Only me` : `${perms.length} members`
    }
  */}, {/*
    id: 'repo',
    label: 'Repo',
    format: (_, {details: obj}) => {
      if (!obj.source) return <></>

      const url = obj.source.url
      return (
        <a href={url} target="_blank" rel="noreferrer" className="flex items-center">
          <GithubIcon fontSize="small" className="text-color" />&nbsp;
          {url.slice(url.lastIndexOf('/') + 1).replace('.git', '')}
        </a>
      )
    }
  */}, {
    id: 'time_created',
    label: 'Last Update'
  }
//   {id: 'id', label: 'Version', hide: true},
]



const queryData = (data: object[], query: string) => {
  return data.filter(row =>
    Object.values(row)
      .join('').toLowerCase()
      .includes(query.toLowerCase())
  )
}

const useParams = () =>
  new URLSearchParams(useLocation().search)


type Row = {
  [key: string]: any
}


type Props = {
  view: 'certified' | 'public' | 'sharedWithMe' | 'myApps'
}

export default function AppList(props: Props) {
  const {view} = props

  const params = useParams()
  const history = useHistory()
  const { enqueueSnackbar } = useSnackbar()

  const query = params.get('query') || ''

  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<Row[]>()
  const [rows, setRows] = useState<Row[]>()
  const [error, setError] = useState(null)

  const [viewStyle, setViewStyle] = useState<'compact' | 'spacious'>('spacious')


  useEffect(() => {
    setLoading(true)

    if (view == 'sharedWithMe') {
      // todo(nc): implement
      setData([])
      setLoading(false)
      return
    }

    listApps()
  }, [view])


  useEffect(() => {
    if (!data) return

    setRows(queryData(data, query))
  }, [query, data])


  const listApps = () => {
    return ECR.listApps()
      .then(data => setData(data))
      .catch(error => setError(error.message))
      .finally(() => setLoading(false))
  }

  // todo: refactor into useContext or table componnent
  const onSearch = ({query}) => {
    if (query) params.set('query', query)
    else params.delete('query')
    history.push({search: params.toString()})
  }


  const handleDelete = (evt, app) => {
    evt.preventDefault()
    ECR.deleteApp(app)
      .then(res => {
        enqueueSnackbar('Deleting app...')
        return listApps()
      }).catch(() => {
        enqueueSnackbar('Failed to delete app', {variant: 'error'})
      }).finally(() => {
        enqueueSnackbar('App deleted!', {variant: 'success'})
      })

  }



  return (
    <Root>
      <Controls>
        <TableSearch
          onSearch={onSearch}
          width="300px"
        />

        <div>
          <IconButton
            onClick={() => setViewStyle('compact')}
            style={{color: viewStyle == 'compact' ? '#000' : '#ccc'}}
            size="small"
          >
            <ViewComfyIcom />
          </IconButton>
          <IconButton
            onClick={() => setViewStyle('spacious')}
            style={{color: viewStyle == 'spacious' ? '#000' : '#ccc'}}
            size="small"
          >
            <SpaciousIcon />
          </IconButton>
        </div>
      </Controls>


      {rows && viewStyle == 'compact' &&
        <Table
          primaryKey="id"
          enableSorting
          columns={columns}
          rows={rows}
        />
      }

      {rows && viewStyle == 'spacious' &&
        <SpaciousLayout
          columns={columns}
          rows={rows}
          onDelete={handleDelete}
        />
      }

      {error &&
        <ErrorMsg>{error}</ErrorMsg>
      }


      {!loading && view == 'myApps' && data?.length == 0 &&
        <NoneFound className="flex column items-center justify-center muted">
          <img src={BeeIcon} />
          <p>You don&apos;t have any apps yet.  Try <Link to="/apps/create-app">creating one</Link>.</p>
        </NoneFound>
      }

      {!loading && view == 'sharedWithMe' && data?.length == 0 &&
        <NoneFound className="flex column items-center justify-center muted">
          <img src={BeeIcon} />
          <p>no apps are shared with you</p>
        </NoneFound>
      }
    </Root>
  )
}

const Root = styled.div`

`

const Controls = styled.div`
  display: flex;
  align-items: center;

  .MuiButton-root,
  .MuiFormControlLabel-root {
    margin: 0 10px;
  }

  & :last-child {
    margin-left: auto;
  }
`

const NoneFound = styled.div`
  font-size: 2.0em;
  padding-top: 100px;

  img {
    width: 175px;
    margin-right: 20px;
    filter: drop-shadow(0px 0px 0.3rem #ccc);
  }
`

