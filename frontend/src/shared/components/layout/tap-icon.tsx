function TapIconComponent(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <mask
        id="tap-mask0"
        style={{ maskType: 'luminance' }}
        maskUnits="userSpaceOnUse"
        x="0"
        y="0"
        width="20"
        height="20"
      >
        <path d="M0 1.90735e-06H20V20H0V1.90735e-06Z" fill="white" />
      </mask>
      <g mask="url(#tap-mask0)">
        <path
          d="M0.585938 5.27344H2.92969V11.5234H0.585938V5.27344Z"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeMiterlimit="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <path
        d="M6.52344 9.96094H2.92969V6.83594H6.52344"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <mask
        id="tap-mask1"
        style={{ maskType: 'luminance' }}
        maskUnits="userSpaceOnUse"
        x="0"
        y="0"
        width="20"
        height="20"
      >
        <path d="M0 1.90735e-06H20V20H0V1.90735e-06Z" fill="white" />
      </mask>
      <g mask="url(#tap-mask1)">
        <path
          d="M12.7734 6.83594H14.7266C17.3154 6.83594 19.4141 8.93461 19.4141 11.5234V12.8906H16.2891V11.5234C16.2891 10.6605 15.5895 9.96094 14.7266 9.96094H12.7734"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeMiterlimit="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M7.69531 5.27344H11.6016C12.2487 5.27344 12.7734 5.79813 12.7734 6.44531V10.3516C12.7734 10.9988 12.2487 11.5234 11.6016 11.5234H7.69531C7.04812 11.5234 6.52344 10.9988 6.52344 10.3516V6.44531C6.52344 5.79813 7.04812 5.27344 7.69531 5.27344Z"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeMiterlimit="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M17.8516 15.2549L16.6038 16.9186C15.8327 17.9468 16.5663 19.4141 17.8516 19.4141C19.1368 19.4141 19.8705 17.9468 19.0993 16.9186L17.8516 15.2549Z"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeMiterlimit="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M8.08594 5.27344H11.2109V2.92969H8.08594V5.27344Z"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeMiterlimit="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12.3828 0.585938H6.91406C6.26687 0.585938 5.74219 1.11062 5.74219 1.75781C5.74219 2.405 6.26687 2.92969 6.91406 2.92969H12.3828C13.03 2.92969 13.5547 2.405 13.5547 1.75781C13.5547 1.11062 13.03 0.585938 12.3828 0.585938Z"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeMiterlimit="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  )
}

export default TapIconComponent
