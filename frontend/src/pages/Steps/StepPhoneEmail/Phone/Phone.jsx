import React, { useState } from "react";
import styles from "../StepPhoneEmail.module.css";
import Card from "../../../../components/shared/Card/Card";
import Button from "../../../../components/shared/Button/Button";
import TextInput from "../../../../components/shared/TextInput/TextInput";
import { sendOtp } from '../../../../http/index';
import { useDispatch } from 'react-redux'
import { setOtp } from "../../../../store/authSlice";

const Phone = ({onNext}) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const dispatch = useDispatch()

  async function submit() {
    //Server request
    /*if (!phoneNumber) {
      return;
    }*/
    const {data} = await sendOtp({phone:phoneNumber})
    console.log(data);
    dispatch(setOtp({phone:data.phone,hash:data.hash}))
    onNext()
  }


  return (
    <Card title="Enter your phone number" icon="phone-icon">
      <TextInput
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
      />
      <div className={styles.midWrapper}>
        <div className={styles.actionButtonWrap}>
          <Button text="Next" onClick={submit}/>
        </div>
        <p className={styles.bottomPara}>
          By entering your number, you’re agreeing to our Terms of Service and
          Privacy Policy. Thanks!
        </p>
      </div>
    </Card>
  );
};

export default Phone;
