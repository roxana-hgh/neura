import LoginSignUpLayout from "../../components/features/user/loginSignUpLayout";
import SignUpForm from "../../components/features/user/SignUpForm";

function SignUpPage() {
  return (
    <div className="w-full h-screen bg-neutral-900 dark">
      <div className="grid md:grid-cols-2 md:h-full">
        <LoginSignUpLayout />
        <div className=" p-4">
         <div className="h-full flex flex-col items-center justify-center gap-2  max-w-125 w-full m-auto">
          <div className="bg-neutral-50 text-neutral-900 p-6 md:p-8 min-w-full sm:min-w-sm rounded-lg flex flex-col gap-3">
             <h2 className="text-lg md:text-2xl text-start w-full font-bold mb-3 ">Create Account</h2>
             {/* <h5 className=" text-base text-muted-foreground w-full mb-3" >login to your Account</h5> */}
             <SignUpForm />
          </div>
         </div>
        </div>
       
      </div>
    </div>
  );
}

export default SignUpPage;
