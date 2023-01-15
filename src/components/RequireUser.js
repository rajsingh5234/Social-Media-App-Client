import React from 'react'
import { Navigate, Outlet } from 'react-router-dom';
import { getItem, KEY_ACCESS_TOKEN } from '../utils/localStorageManager'

const RequireUser = () => {

    const user = getItem(KEY_ACCESS_TOKEN);

  return (
    user? <Outlet/> : <Navigate to='/login'/>
  )
}

export default RequireUser