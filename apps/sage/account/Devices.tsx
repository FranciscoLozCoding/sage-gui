import { useState } from 'react'
import styled from 'styled-components'
import { TextField, Button, Alert } from '@mui/material'

import * as Devices from '/components/apis/devices'

const idLength = 16

export default function DeviceRegistration() {
  const [form, setForm] = useState({deviceID: ''})
  const [gotKey, setGotKey] = useState(false)
  const [errMsg, setErrMsg] = useState('')

  const handleRegister = () => {
    // todo: actually use device ID
    Devices.register()
      .then((data) => {
        setGotKey(true)
        const a = document.createElement('a')
        a.href = window.URL.createObjectURL(data)
        a.download = 'registration.zip'
        a.click()
      }).catch(err => {
        setGotKey(false)
        setErrMsg(err.message)
      })
  }

  return (
    <Root>
      <div className="flex column gap">
        <h1 className="no-margin">Get development beehive keys for your Waggle device</h1>

        <h2>Enter your Waggle device ID</h2>
        <TextField
          id="nano-id"
          placeholder="Nano ID"
          style={{ width: 500 }}
          inputProps={{ maxlength: idLength }}
          value={form.deviceID}
          onChange={evt => setForm(prev => ({...prev, deviceID: evt.target.value}))}
          required={true}
          disabled={gotKey}
        />

        <div>
          <Button
            variant="contained"
            type="submit"
            id="publish-waggle"
            style={{ width: 120 }}
            onClick={handleRegister}
            disabled={form.deviceID.length != idLength || gotKey}
          >
            {!gotKey ? 'Get Keys' :  'Got Keys!'}
          </Button>
        </div>

        {gotKey &&
          <Alert severity="success">Check your download folder for registration keys!</Alert>
        }

        {errMsg &&
          <Alert severity="error">{errMsg}</Alert>
        }
      </div>
    </Root>
  )
}


const Root = styled.div`

  > div {
    margin-bottom: 2em;
  }

  [type=submit] {
    margin-top: 2em;
  }
`