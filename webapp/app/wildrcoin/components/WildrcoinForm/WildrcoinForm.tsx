import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import SwiperCore from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/react';
import ReCAPTCHA from 'react-google-recaptcha';
import { FieldValues, useForm } from 'react-hook-form';
import { useMutation } from '@apollo/client';
import { checkmark, info } from '@/assets/images';
import { WILDRCOIN_FORM_ERROR, wildrcoinTranslations } from '../../data';
import { ADD_EMAIL_TO_WAITLIST } from '../WildrcoinMain/queries';
import {
  StyledError,
  StyledFormWrapper,
  StyledSuccess,
  StyledWildrcoinForm,
  StyledWildrcoinLink,
} from './styles';
import {
  AddEmailToWaitlistMutation,
  AddEmailToWaitlistMutationVariables,
  WaitlistType,
} from '@/types/graphql_generated/graphql';
import { StyledParagraph4, StyledParagraph4Bold } from '@/app/globalStyles';

import 'swiper/css';

export const WildrcoinForm = () => {
  const [email, setEmail] = useState<string>('');
  const [error, setError] = useState<WILDRCOIN_FORM_ERROR | null>(null);
  const [swiper, setSwiper] = useState<SwiperCore>();
  const captchaRef = useRef<ReCAPTCHA>(null);

  const [addEmailToWaitlist, { error: gqlError, data }] = useMutation<
    AddEmailToWaitlistMutation,
    AddEmailToWaitlistMutationVariables
  >(ADD_EMAIL_TO_WAITLIST, {
    variables: {
      input: { waitlistType: WaitlistType.Wildrcoin, email },
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors: formErrors },
  } = useForm();

  const onSubmit = (values: FieldValues) => {
    setEmail(values.email);
    if (error) setError(null);
    swiper?.slideTo(1);
  };

  const onCaptchaChange = (token: string | null) => {
    if (!token) return setError(WILDRCOIN_FORM_ERROR.GENERAL);
    if (error) setError(null);
    addEmailToWaitlist();
  };

  useEffect(() => {
    if (
      Object.values(formErrors).length > 0 &&
      data?.addEmailToWaitlist.__typename !== 'AddEmailToWaitlistResult'
    )
      setError(WILDRCOIN_FORM_ERROR.EMAIL);
    if (
      (gqlError || data?.addEmailToWaitlist.__typename === 'SmartError') &&
      data?.addEmailToWaitlist.__typename !== 'AddEmailToWaitlistResult'
    ) {
      setError(WILDRCOIN_FORM_ERROR.GENERAL);
      swiper?.slideTo(0);
    }

    if (data?.addEmailToWaitlist.__typename === 'AddEmailToWaitlistResult')
      swiper?.slideTo(2);
  }, [formErrors, gqlError, data, swiper]);

  return (
    <StyledFormWrapper>
      {error && (
        <StyledError>
          <Image src={info} alt="info" />
          <StyledParagraph4>
            {wildrcoinTranslations[error as keyof typeof wildrcoinTranslations]}
          </StyledParagraph4>
        </StyledError>
      )}
      <Swiper onSwiper={setSwiper} allowTouchMove={false}>
        <SwiperSlide>
          <StyledWildrcoinForm onSubmit={handleSubmit(onSubmit)}>
            <input
              placeholder={
                wildrcoinTranslations.page_wildrcoin_input_placeholder
              }
              {...register('email', {
                required: true,
                pattern: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i,
              })}
            />
            <button type="submit">
              <StyledParagraph4Bold>
                {wildrcoinTranslations.page_wildrcoin_btn}
              </StyledParagraph4Bold>
            </button>
          </StyledWildrcoinForm>
        </SwiperSlide>
        <SwiperSlide>
          <ReCAPTCHA
            sitekey={process.env.RECAPTCHA_SITE_KEY!}
            ref={captchaRef}
            onChange={onCaptchaChange}
          />
        </SwiperSlide>
        <SwiperSlide>
          <StyledSuccess>
            <Image src={checkmark} alt="checkmark" />
            <StyledParagraph4>
              {wildrcoinTranslations.page_wildrcoin_success}
            </StyledParagraph4>
          </StyledSuccess>
        </SwiperSlide>
      </Swiper>
      <StyledWildrcoinLink>
        {wildrcoinTranslations.page_wildrcoin_link_desc}
        <Link href="/legal/terms-of-service">
          {wildrcoinTranslations.page_wildrcoin_link}
        </Link>
      </StyledWildrcoinLink>
    </StyledFormWrapper>
  );
};
