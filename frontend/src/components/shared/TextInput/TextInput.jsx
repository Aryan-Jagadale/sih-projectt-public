import React from 'react'
import styles from "./Textinput.module.css";

const TextInput = (props) => {
  return (
    <input className={styles.input} style={{
      width: props.fullwidth === 'true' ? '100%':''
    }} type="text" {...props} />
  )
}

export default TextInput