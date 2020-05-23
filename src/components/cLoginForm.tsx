import { h } from 'sinuous';

const LoginForm = () => {
  const Item = ({ name, error }: { name: string; error?: string }) =>
    <div className="mb-3">
      <label className="block text-grey-darker text-sm font-bold mb-2" htmlFor="username">
        {name}
      </label>
      <input
        className="shadow appearance-none border rounded w-full py-2 px-3 text-grey-darker"
        id="username"
        type="text"
        placeholder={
          name !== 'Password'
            ? name
            : '*****'
        }
      />
      {error
        && <p className="mt-3 text-red-400 text-xs italic">{error}</p>}
    </div>;

  return (
    <div className="mb-6">
      <Item name="Username" />
      <Item name="Password" error="Please choose a password" />
      <button className="bg-blue-400 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded" type="button">
        Sign In
      </button>
    </div>
  );
};

export { LoginForm };
