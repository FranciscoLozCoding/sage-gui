import { useState, useEffect } from 'react'
import styled from 'styled-components'

import { TextField, Button, IconButton, MenuItem, Popper, Autocomplete } from '@mui/material'
import RmIcon from '@mui/icons-material/DeleteOutlineRounded'

import { type AppDetails } from '/components/apis/ecr'

import * as BH from '/components/apis/beehive'

import 'cron-expression-input/lib/cron-expression-input.min.css'
import 'cron-expression-input'

import {
  type ConditionRule, type CronRule, type Rule, type RuleType, type BooleanLogic,
  booleanLogics, ops, aggFuncs
} from './ses-types.d'



declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'cron-expression-input': HTMLElement
    }
  }
}

type ConditionalInputProps =
  ConditionRule & {
    names: string[]
    onChange(name: keyof ConditionRule, value: ConditionRule['value'])
  }


function ConditionalInput(props: ConditionalInputProps) {
  const {names, name, onChange} = props

  // support raw text name inputs too
  const [newInput, setNewInput] = useState(false)

  return (
    <div className="flex items-center gap">
      <div className="flex column">
        <h4 className="no-margin">Run when</h4>
        <small>
          (<a onClick={() => setNewInput(!newInput)}>
            {newInput ? 'filter menu' : 'free input'}
          </a>)
        </small>
      </div>

      <TextField select
        defaultValue={'avg'}
        onChange={(evt) => onChange('func', evt.target.value)}
        sx={{maxWidth: '110px'}}
      >
        {aggFuncs.map(v =>
          <MenuItem key={v} value={v}>{v}</MenuItem>
        )}
      </TextField>

      {newInput ?
        <TextField
          placeholder="env.some.value"
          onChange={(evt) => onChange('name', evt.target.value)}
        /> :
        <Autocomplete
          options={(names || [])}
          renderInput={(props) =>
            <TextField {...props}  />}
          PopperComponent={(props) =>
            <Popper {...props} sx={{minWidth: '400px'}} />}
          value={name}
          onChange={(evt, val) => onChange('name', val)}
          sx={{width: '300px'}}
        />
      }

      <TextField select
        defaultValue={'>'}
        onChange={(evt) => onChange('op', evt.target.value)}
        sx={{maxWidth: '60px'}}
      >
        {Object.entries(ops).map(([v, l]) =>
          <MenuItem key={v} value={v}>{l}</MenuItem>
        )}
      </TextField>

      <TextField
        type="number"
        placeholder="3"
        onChange={(evt) => onChange('value', evt.target.value)}
      />
    </div>
  )
}



type CronProps =
  CronRule & {
    onChange(value: string)
  }


function CronInput(props: CronProps) {
  const {cron, onChange} = props

  return (
    <div className="flex items-center gap">
      <h4>Run every</h4>
      <cron-expression-input
        value={cron || '* * * * *'}
        onInput={(evt) => onChange('crontString', evt.nativeEvent.detail.value)}
        color="1c8cc9" />
    </div>
  )
}




/**
 *  minimal app example
/*
const apps = [{
  "id": "dariodematties1/avian-diversity-monitoring:0.2.4",
  "inputs": [],
  "name": "avian-diversity-monitoring",
  "namespace": "dariodematties1",
  "owner": "dariodematties1",
  "time_last_updated": "2022-04-15T17:33:31Z",
  "version": "0.2.4"
}]
*/



type RulesProps = {
  onChange: (rules: Rule[], booleanLogics: BooleanLogic[]) => void
}

function Rules(props: RulesProps) {
  const {onChange} = props

  const [rules, setRules] = useState<Rule[]>([])
  const [logics, setLogics] = useState<BooleanLogic[]>([])
  const [ontologyNames, setOntologyNames] = useState<string[]>()

  useEffect(() => {
    BH.getData({start: '-30d', tail: 1, filter: {name: 'env.*'}})
      .then(data => setOntologyNames([...new Set(data.map(o => o.name))]))
  }, [])

  useEffect(() => {
    onChange(rules, logics)
  }, [rules, logics])


  const handleAddRule = (type: RuleType) => {
    if (rules.length >= 1) {
      setLogics(prev => [...prev, 'and'])
    }

    if (type == 'cron') {
      setRules(prev => [...prev, {amount: 5, unit: 'min'}])
    } else if (type == 'condition') {
      setRules(prev => [...prev, {name: 'env.raingauge.uint', op: '>', value: 3}])
    }
  }

  const handleUpdateRule = (i, type: RuleType, name, value) => {
    setRules(prev => {
      const newRule = {...prev[i], [name]: value}
      return prev.map((rule, k) => k == i ? newRule : rule)
    })
  }

  const handleUpdateLogic = (i, value) => {
    setLogics(prev => prev.map((old, k) => k == i ? value : old))
  }

  const handleRmRule = (i) => {
    setRules(prev => prev.filter((_, k) => k != i))
    setLogics(prev => prev.filter((_, k) => k != i))
  }

  return (
    <div>
      {!rules.length && <div className="flex gap">
        <Button onClick={() => handleAddRule('cron')} variant="outlined">Run every...</Button>
        <Button onClick={() => handleAddRule('condition')} variant="outlined">Run when...</Button>
      </div>}


      {rules.map((rule, i) =>
        <RuleInput className="flex items-center justify-between" key={i}>
          <div className="flex items-center gap">
            {'amount' in rule &&
              <CronInput {...rule} onChange={(name, value) => handleUpdateRule(i, 'cron', name, value)} />
            }

            {'name' in rule &&
              <ConditionalInput
                {...rule}
                names={ontologyNames}
                onChange={(name, value) => handleUpdateRule(i, 'condition', name, value)}
              />
            }


            {i < rules.length - 1 &&
              <TextField select
                defaultValue={'and'}
                onChange={(evt) => handleUpdateLogic(i, evt.target.value)}
              >
                {booleanLogics.map(v =>
                  <MenuItem key={v} value={v}>{v}</MenuItem>
                )}
              </TextField>
            }

            {i == rules.length - 1 &&
              <>
                <b>and/or</b>
                <Button onClick={() => handleAddRule('condition')} variant="outlined">Run when...</Button>
                <Button onClick={() => handleAddRule('cron')} variant="outlined">Run every...</Button>
              </>
            }
          </div>

          <IconButton onClick={() => handleRmRule(i)}><RmIcon/></IconButton>

        </RuleInput>
      )}
    </div>
  )
}


const RuleInput = styled.div`
  .cron-amount {
    width: 100px;
  }
`


type Props = {
  apps: AppDetails[]
  onChange: (app: string, rules: Rule[], logics: BooleanLogic[]) => void
}


export default function RuleBuilder(props: Props) {
  const {apps, onChange} = props

  return (
    <Root>
      {apps.map(app => {
        const {id, name} = app

        return (
          <div key={id}>
            <p>Rules for: <b>{name}</b></p>
            <Rules key={id} onChange={(rules, logics) => onChange(id, rules, logics)}/>
          </div>
        )
      })}
    </Root>
  )
}

const Root = styled.div`
  cron-expression-input .modal-dialog {
    margin-top: 200px !important; // override lib
  }
`
