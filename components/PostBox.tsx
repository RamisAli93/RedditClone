import React, { useState } from "react"
import { useSession } from "next-auth/react"
import { ADD_POST, ADD_SUBREDDIT } from "../graphql/mutations"
import { LinkIcon, PhotoIcon } from "@heroicons/react/24/outline"
import { useForm } from "react-hook-form"
import { useMutation } from "@apollo/client"
import Avatar from "./Avatar"
import client from "../apollo-client"
import { GET_SUBREDDIT_BY_TOPIC, GET_ALL_POSTS } from "../graphql/queries"
import toast from "react-hot-toast"
type FormData = {
  postTitle: string
  postBody: string
  postImage: string
  subreddit: string
}
type Props = {
  subreddit?: string
}
function PostBox({ subreddit }: Props) {
  const { data: session } = useSession()
  const [addPost, { data, loading, error }] = useMutation(ADD_POST, {
    refetchQueries: [GET_ALL_POSTS, "getPostList"],
  })
  if (error) console.log(`${error.message}`)
  const [addSubReddit] = useMutation(ADD_SUBREDDIT)

  const [imageBoxOpen, setImageBoxOpen] = useState<boolean>(false)
  const {
    register,
    setValue,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>()
  const onSubmit = handleSubmit(async (formData) => {
    console.log(formData)
    const notification = toast.loading("Creating new post...")
    try {
      //Query for the subredit topic
      const {
        data: { getSubredditListByTopic },
      } = await client.query({
        query: GET_SUBREDDIT_BY_TOPIC,
        variables: {
          topic: subreddit || formData.subreddit,
        },
      })
      const subRedditExists = getSubredditListByTopic.length > 0
      if (!subRedditExists) {
        //create subreddit by inserting that topic with id in subReddit table
        console.log("SubReddit is new ! -> creating a new SubReddit!")
        const {
          data: { insertSubredditByTopic: newSubReddit },
        } = await addSubReddit({
          variables: {
            topic: formData.subreddit,
          },
        })
        console.log("Creating post...", formData)
        const image = formData.postImage || ""
        const {
          data: { insertPost: newPost },
        } = await addPost({
          variables: {
            body: formData.postBody,
            title: formData.postTitle,
            image: image,
            subreddit_id: newSubReddit.id,
            username: session?.user?.name,
          },
        })
        console.log("New Post Added: ", newPost)
      } else {
        //insert in post table
        console.log("Creating Post from existing subReddit!")

        const image = formData.postImage || ""
        const {
          data: { insertPost: newPost },
        } = await addPost({
          variables: {
            body: formData.postBody,
            title: formData.postTitle,
            image: image,
            subreddit_id: getSubredditListByTopic[0].id,
            username: session?.user?.name,
          },
        })
        console.log("New Post Added: ", newPost)
      }
      //after addition
      setValue("postBody", "")
      setValue("postImage", "")
      setValue("postTitle", "")
      setValue("subreddit", "")
      toast.success("New post Created", {
        id: notification,
      })
    } catch (error) {
      toast.error("Oops! Someting went wrong...", {
        id: notification,
      })
    }
  })
  return (
    <form
      onSubmit={onSubmit}
      className="sticky top-20 z-50 bg-white border rounded-md border-gray-300 p-2"
    >
      <div className="flex items-center space-x-3">
        {/*Avatar */}
        <Avatar />
        <input
          {...register("postTitle", { required: true })}
          disabled={!session}
          className="bg-gray-50 p-2 pl-5 outline-none rounded-md flex-1"
          type="text"
          placeholder={
            session
              ? subreddit
                ? `Create a Post in Subreddit /r${subreddit}`
                : "Create a post by entering a title!"
              : "Sign in to Post"
          }
        />
        <PhotoIcon
          onClick={() => setImageBoxOpen(!imageBoxOpen)}
          className={`h-6 text-gray-300 cursor-pointer ${
            imageBoxOpen && "text-blue-300"
          }`}
        />
        <LinkIcon className="h-6 text-gray-300" />
      </div>
      {!!watch("postTitle") && (
        <div className="flex flex-col py-2">
          {/*Body */}
          <div className="flex items-center px-2">
            <p className="min-w-[90px]">Body:</p>
            <input
              className="m-2 flex-1 bg-blue-50 p-2 outline-none"
              {...register("postBody")}
              type="text"
              placeholder="Text (optional)"
            />
          </div>
          {!subreddit && (
            <div className="flex items-center px-2">
              <p className="min-w-[90px]">Subreddit:</p>
              <input
                className="m-2 flex-1 bg-blue-50 p-2 outline-none"
                {...register("subreddit", { required: true })}
                type="text"
                placeholder="i.e. ReactJS"
              />
            </div>
          )}
          {imageBoxOpen && (
            <div className="flex items-center px-2">
              <p className="min-w-[90px]">Image URL:</p>
              <input
                className="m-2 flex-1 bg-blue-50 p-2 outline-none"
                {...register("postImage")}
                type="text"
                placeholder="Optional..."
              />
            </div>
          )}
          {/*Errors */}
          {Object.keys(errors).length > 0 && (
            <div className="space-y-2 p-2 text-red-500 ">
              {errors.postTitle?.type === "required" && (
                <p>- A post title is required</p>
              )}
              {errors.subreddit?.type === "required" && (
                <p>- A Subreddit is required</p>
              )}
            </div>
          )}
          {!!watch("postTitle") && (
            <button
              type="submit"
              className="w-full rounded-full bg-blue-400 p-2 text-white"
            >
              Create Post
            </button>
          )}
        </div>
      )}
    </form>
  )
}

export default PostBox
